import { Organization, Account, Contact, Deal, Ticket, Invoice } from '../../models/index.js';
import { IErpConnector, ErpSyncStats } from './types.js';
import { ErpConnectorFactory } from './connectorFactory.js';
import {
  AccountTier,
  DealStage,
  TicketChannel,
  TicketCategory,
  TicketSeverity,
  TicketStatus,
  InvoiceStatus,
  InvoiceMatchStatus,
} from '@nexora/core';

export class ErpSyncService {
  public static async syncOrganization(organizationId?: string): Promise<ErpSyncStats> {
    const startedAt = new Date();
    const errors: string[] = [];
    let partnersSynced = 0;
    let invoicesSynced = 0;
    let ticketsSynced = 0;
    let dealsSynced = 0;

    const org = organizationId
      ? await Organization.findById(organizationId)
      : await Organization.findOne();

    if (!org) {
      throw new Error('Organization not found for ERP sync');
    }

    // Resolve connector
    const connector: IErpConnector = ErpConnectorFactory.createConnector({
      provider: org.erp_config.provider,
      host: org.erp_config.host,
      db: org.erp_config.db,
    });

    // 1. Sync Partners -> Accounts & Contacts
    try {
      const partners = await connector.fetchPartners();
      for (const p of partners) {
        const erpIdStr = String(p.id);
        const tier = (p.credit_limit || 0) > 100000
          ? AccountTier.ENTERPRISE
          : (p.credit_limit || 0) > 40000
          ? AccountTier.MID_MARKET
          : AccountTier.SMB;

        const account = await Account.findOneAndUpdate(
          { organization_id: org._id, erp_id: erpIdStr },
          {
            $set: {
              name: p.name,
              tier,
              last_synced_at: new Date(),
            },
          },
          { upsert: true, new: true }
        );

        if (p.email) {
          await Contact.findOneAndUpdate(
            { organization_id: org._id, account_id: account._id, email: p.email.toLowerCase() },
            {
              $set: {
                name: p.name,
                phone: p.phone,
                erp_id: `C-${erpIdStr}`,
                is_primary: true,
              },
            },
            { upsert: true }
          );
        }
        partnersSynced++;
      }
    } catch (err: any) {
      errors.push(`Partners sync error: ${err.message}`);
    }

    // 2. Sync Invoices
    try {
      const invoices = await connector.fetchInvoices();
      for (const inv of invoices) {
        const partnerErpId = String(inv.partner_id);
        const account = await Account.findOne({ organization_id: org._id, erp_id: partnerErpId });

        if (account) {
          const invStatus = inv.payment_state === 'paid'
            ? InvoiceStatus.PAID
            : inv.state === 'cancel'
            ? InvoiceStatus.CANCELLED
            : InvoiceStatus.POSTED;

          await Invoice.findOneAndUpdate(
            { organization_id: org._id, erp_id: String(inv.id) },
            {
              $set: {
                account_id: account._id,
                invoice_number: inv.invoice_number,
                po_number: inv.po_number,
                amount: inv.amount_total,
                status: invStatus,
                match_status: InvoiceMatchStatus.THREE_WAY_MATCHED,
                due_date: new Date(inv.invoice_date_due),
                synced_at: new Date(),
              },
            },
            { upsert: true }
          );
          invoicesSynced++;
        }
      }
    } catch (err: any) {
      errors.push(`Invoices sync error: ${err.message}`);
    }

    // 3. Sync Tickets
    try {
      const tickets = await connector.fetchTickets();
      for (const t of tickets) {
        const partnerErpId = t.partner_id ? String(t.partner_id) : null;
        let account = partnerErpId
          ? await Account.findOne({ organization_id: org._id, erp_id: partnerErpId })
          : null;

        if (!account && t.partner_email) {
          const contact = await Contact.findOne({ organization_id: org._id, email: t.partner_email.toLowerCase() });
          if (contact) {
            account = await Account.findById(contact.account_id);
          }
        }

        if (account) {
          await Ticket.findOneAndUpdate(
            { organization_id: org._id, erp_id: String(t.id) },
            {
              $set: {
                account_id: account._id,
                ticket_number: t.ticket_ref,
                subject: t.name,
                category: TicketCategory.ORDER_STATUS,
                severity: t.priority === '3' ? TicketSeverity.CRITICAL : TicketSeverity.MEDIUM,
                status: t.stage_name === 'Solved' ? TicketStatus.RESOLVED : TicketStatus.IN_PROGRESS,
                synced_at: new Date(),
              },
              $setOnInsert: {
                channel: TicketChannel.CHAT,
                confidence_score: 0.88,
                messages: [
                  {
                    sender_type: 'CUSTOMER',
                    sender_name: account.name,
                    content: t.description,
                    timestamp: new Date(t.create_date),
                  },
                ],
              },
            },
            { upsert: true }
          );
          ticketsSynced++;
        }
      }
    } catch (err: any) {
      errors.push(`Tickets sync error: ${err.message}`);
    }

    // 4. Sync Sale Orders -> Deals
    try {
      const orders = await connector.fetchSaleOrders();
      for (const o of orders) {
        const partnerErpId = String(o.partner_id);
        const account = await Account.findOne({ organization_id: org._id, erp_id: partnerErpId });

        if (account) {
          await Deal.findOneAndUpdate(
            { organization_id: org._id, erp_id: String(o.id) },
            {
              $set: {
                account_id: account._id,
                name: `Contract - ${o.order_ref}`,
                stage: o.state === 'sale' ? DealStage.CLOSED_WON : DealStage.PROPOSAL,
                value: o.amount_total,
                synced_at: new Date(),
              },
              $setOnInsert: {
                source: 'ERP_SYNC',
                intent_score: 0.85,
              },
            },
            { upsert: true }
          );
          dealsSynced++;
        }
      }
    } catch (err: any) {
      errors.push(`Deals sync error: ${err.message}`);
    }

    // 5. Recalculate Account 360 Health Scores and Counts across Shared Data Fabric
    const allAccounts = await Account.find({ organization_id: org._id });
    for (const acc of allAccounts) {
      const [openDeals, openTickets, overdueInvoices] = await Promise.all([
        Deal.countDocuments({ account_id: acc._id, stage: { $in: [DealStage.PROSPECTING, DealStage.QUALIFIED, DealStage.PROPOSAL, DealStage.NEGOTIATION] } }),
        Ticket.countDocuments({ account_id: acc._id, status: { $in: [TicketStatus.NEW, TicketStatus.IN_PROGRESS, TicketStatus.PENDING_APPROVAL] } }),
        Invoice.countDocuments({ account_id: acc._id, status: { $in: [InvoiceStatus.POSTED, InvoiceStatus.DISPUTED] }, due_date: { $lt: new Date() } }),
      ]);

      // Calculate health score: 100 base, minus 15 per open critical ticket, minus 20 per overdue invoice
      let calculatedHealth = 100 - openTickets * 12 - overdueInvoices * 20;
      calculatedHealth = Math.max(10, Math.min(100, calculatedHealth));

      acc.open_deals_count = openDeals;
      acc.open_tickets_count = openTickets;
      acc.overdue_invoices_count = overdueInvoices;
      acc.health_score = calculatedHealth;
      await acc.save();
    }

    // Update Organization ERP status
    org.erp_config.last_synced_at = new Date();
    org.erp_config.status = errors.length > 0 ? 'error' : 'connected';
    await org.save();

    const completedAt = new Date();
    return {
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: completedAt.getTime() - startedAt.getTime(),
      partners_synced: partnersSynced,
      invoices_synced: invoicesSynced,
      tickets_synced: ticketsSynced,
      deals_synced: dealsSynced,
      errors,
    };
  }
}
