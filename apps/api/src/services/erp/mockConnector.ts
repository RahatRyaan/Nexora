import {
  IErpConnector,
  ErpPartner,
  ErpInvoice,
  ErpTicket,
  ErpSaleOrder,
  ErpWriteResult,
} from './types.js';
import { mockErpInstance } from '../../mock-erp/server.js';
import { ErpProvider } from '@nexora/core';

export class MockConnector implements IErpConnector {
  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    return {
      success: true,
      message: 'Mock ERP sandbox is active and responsive',
      details: {
        provider: 'mock',
        status: 'online',
        partner_count: mockErpInstance.getPartners().length,
        invoice_count: mockErpInstance.getInvoices().length,
      },
    };
  }

  public async fetchPartners(_since?: Date): Promise<ErpPartner[]> {
    const raw = mockErpInstance.getPartners();
    return raw.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      street: p.street,
      city: p.city,
      credit_limit: p.credit_limit,
      total_due: p.total_due,
      customer_rank: p.customer_rank,
      raw_data: p,
    }));
  }

  public async fetchInvoices(partnerId?: any): Promise<ErpInvoice[]> {
    const raw = mockErpInstance.getInvoices(typeof partnerId === 'number' ? partnerId : undefined);
    return raw.map((i) => ({
      id: i.id,
      invoice_number: i.name,
      partner_id: i.partner_id[0],
      partner_name: i.partner_id[1],
      amount_total: i.amount_total,
      amount_residual: i.amount_residual,
      state: i.state,
      payment_state: i.payment_state,
      invoice_date: i.invoice_date,
      invoice_date_due: i.invoice_date_due,
      po_number: i.ref,
      raw_data: i,
    }));
  }

  public async fetchTickets(partnerId?: any): Promise<ErpTicket[]> {
    const raw = mockErpInstance.getTickets(typeof partnerId === 'number' ? partnerId : undefined);
    return raw.map((t) => ({
      id: t.id,
      ticket_ref: t.ticket_ref,
      name: t.name,
      partner_id: t.partner_id[0],
      partner_email: t.partner_email,
      stage_name: t.stage_id[1],
      priority: t.priority,
      description: t.description,
      create_date: t.create_date,
      raw_data: t,
    }));
  }

  public async fetchSaleOrders(partnerId?: any): Promise<ErpSaleOrder[]> {
    const raw = mockErpInstance.getOrders(typeof partnerId === 'number' ? partnerId : undefined);
    return raw.map((o) => ({
      id: o.id,
      order_ref: o.name,
      partner_id: o.partner_id[0],
      partner_name: o.partner_id[1],
      amount_total: o.amount_total,
      state: o.state,
      date_order: o.date_order,
      raw_data: o,
    }));
  }

  public async issueRefundCredit(
    invoiceId: string | number,
    amount: number,
    reason: string,
    dryRun: boolean = false
  ): Promise<ErpWriteResult> {
    const numId = typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId;
    if (dryRun) {
      return {
        success: true,
        provider: ErpProvider.MOCK,
        model: 'account.move.reversal',
        record_id: numId,
        message: `[DRY RUN] Would issue credit memo of $${amount} against mock invoice #${numId}`,
        updated_fields: { amount, reason },
        dry_run: true,
        timestamp: new Date().toISOString(),
      };
    }

    const res = mockErpInstance.issueRefundCredit(numId, amount, reason);
    return {
      success: res.success,
      provider: ErpProvider.MOCK,
      model: res.model,
      record_id: res.record_id,
      message: res.message,
      updated_fields: res.updated_fields,
      dry_run: false,
      timestamp: res.timestamp,
    };
  }

  public async updateTicketStatus(
    ticketId: string | number,
    stageName: string,
    resolutionSummary: string,
    dryRun: boolean = false
  ): Promise<ErpWriteResult> {
    const numId = typeof ticketId === 'string' ? parseInt(ticketId, 10) : ticketId;
    if (dryRun) {
      return {
        success: true,
        provider: ErpProvider.MOCK,
        model: 'helpdesk.ticket',
        record_id: numId,
        message: `[DRY RUN] Would update mock ticket #${numId} to stage '${stageName}'`,
        updated_fields: { stageName, resolutionSummary },
        dry_run: true,
        timestamp: new Date().toISOString(),
      };
    }

    const res = mockErpInstance.updateTicketStatus(numId, stageName, resolutionSummary);
    return {
      success: res.success,
      provider: ErpProvider.MOCK,
      model: res.model,
      record_id: res.record_id,
      message: res.message,
      updated_fields: res.updated_fields,
      dry_run: false,
      timestamp: res.timestamp,
    };
  }
}
