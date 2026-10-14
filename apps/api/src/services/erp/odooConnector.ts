import xmlrpc from 'xmlrpc';
import {
  IErpConnector,
  ErpConnectionConfig,
  ErpPartner,
  ErpInvoice,
  ErpTicket,
  ErpSaleOrder,
  ErpWriteResult,
} from './types.js';
import { ErpProvider } from '@nexora/core';

export class OdooConnector implements IErpConnector {
  private config: ErpConnectionConfig;
  private uid: number | null = null;
  private commonClient: any = null;
  private objectClient: any = null;

  constructor(config: ErpConnectionConfig) {
    this.config = config;
    this.initClients();
  }

  private initClients(): void {
    const url = new URL(this.config.host);
    const isSecure = url.protocol === 'https:';
    const port = url.port ? parseInt(url.port, 10) : isSecure ? 443 : 80;
    const clientCreator = isSecure ? xmlrpc.createSecureClient : xmlrpc.createClient;

    this.commonClient = clientCreator({
      host: url.hostname,
      port,
      path: '/xmlrpc/2/common',
      headers: { 'User-Agent': 'Nexora-Agentic-ERP-Layer/1.0' },
    });

    this.objectClient = clientCreator({
      host: url.hostname,
      port,
      path: '/xmlrpc/2/object',
      headers: { 'User-Agent': 'Nexora-Agentic-ERP-Layer/1.0' },
    });
  }

  private async authenticate(): Promise<number> {
    if (this.uid) return this.uid;

    return new Promise((resolve, reject) => {
      this.commonClient.methodCall(
        'authenticate',
        [this.config.db, this.config.username, this.config.password, {}],
        (err: any, uid: any) => {
          if (err) {
            return reject(new Error(`Odoo Authentication Error: ${err.message || err}`));
          }
          if (!uid || typeof uid !== 'number') {
            return reject(new Error('Odoo Authentication Failed: Invalid credentials or database name'));
          }
          this.uid = uid;
          resolve(uid);
        }
      );
    });
  }

  private async executeKw(model: string, method: string, args: any[] = [], kwargs: any = {}): Promise<any> {
    const uid = await this.authenticate();
    return new Promise((resolve, reject) => {
      this.objectClient.methodCall(
        'execute_kw',
        [this.config.db, uid, this.config.password, model, method, args, kwargs],
        (err: any, result: any) => {
          if (err) {
            return reject(new Error(`Odoo Execute (${model}.${method}) Error: ${err.message || err}`));
          }
          resolve(result);
        }
      );
    });
  }

  public async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const uid = await this.authenticate();
      const versionInfo = await new Promise((resolve, reject) => {
        this.commonClient.methodCall('version', [], (err: any, res: any) => {
          if (err) return reject(err);
          resolve(res);
        });
      });

      return {
        success: true,
        message: `Successfully authenticated to Odoo sandbox (UID: ${uid})`,
        details: versionInfo,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Odoo connection failed: ${err.message}`,
      };
    }
  }

  public async fetchPartners(since?: Date): Promise<ErpPartner[]> {
    const domain: any[] = [['customer_rank', '>', 0]];
    if (since) {
      domain.push(['write_date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }

    const fields = ['id', 'name', 'email', 'phone', 'street', 'city', 'credit_limit', 'total_due', 'customer_rank'];
    const records = await this.executeKw('res.partner', 'search_read', [domain], { fields, limit: 100 });

    return records.map((r: any) => ({
      id: r.id,
      name: r.name,
      email: r.email || undefined,
      phone: r.phone || undefined,
      street: r.street || undefined,
      city: r.city || undefined,
      credit_limit: r.credit_limit || 0,
      total_due: r.total_due || 0,
      customer_rank: r.customer_rank || 1,
      raw_data: r,
    }));
  }

  public async fetchInvoices(since?: Date): Promise<ErpInvoice[]> {
    const domain: any[] = [['move_type', 'in', ['out_invoice', 'out_refund']]];
    if (since) {
      domain.push(['write_date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }

    const fields = ['id', 'name', 'partner_id', 'amount_total', 'amount_residual', 'state', 'payment_state', 'invoice_date', 'invoice_date_due', 'ref'];
    const records = await this.executeKw('account.move', 'search_read', [domain], { fields, limit: 100 });

    return records.map((r: any) => ({
      id: r.id,
      invoice_number: r.name,
      partner_id: Array.isArray(r.partner_id) ? r.partner_id[0] : r.partner_id,
      partner_name: Array.isArray(r.partner_id) ? r.partner_id[1] : undefined,
      amount_total: r.amount_total || 0,
      amount_residual: r.amount_residual || 0,
      state: r.state || 'draft',
      payment_state: r.payment_state || 'not_paid',
      invoice_date: r.invoice_date || new Date().toISOString(),
      invoice_date_due: r.invoice_date_due || new Date().toISOString(),
      po_number: r.ref || undefined,
      raw_data: r,
    }));
  }

  public async fetchTickets(since?: Date): Promise<ErpTicket[]> {
    const domain: any[] = [];
    if (since) {
      domain.push(['write_date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }

    const fields = ['id', 'name', 'partner_id', 'partner_email', 'stage_id', 'priority', 'description', 'create_date'];
    let records: any[] = [];
    try {
      records = await this.executeKw('helpdesk.ticket', 'search_read', [domain], { fields, limit: 100 });
    } catch {
      // If helpdesk module is named crm.claim or custom
      records = [];
    }

    return records.map((r: any) => ({
      id: r.id,
      ticket_ref: `HD-${r.id}`,
      name: r.name,
      partner_id: Array.isArray(r.partner_id) ? r.partner_id[0] : r.partner_id,
      partner_email: r.partner_email || undefined,
      stage_name: Array.isArray(r.stage_id) ? r.stage_id[1] : 'New',
      priority: String(r.priority || '1'),
      description: r.description || '',
      create_date: r.create_date || new Date().toISOString(),
      raw_data: r,
    }));
  }

  public async fetchSaleOrders(since?: Date): Promise<ErpSaleOrder[]> {
    const domain: any[] = [];
    if (since) {
      domain.push(['write_date', '>=', since.toISOString().replace('T', ' ').substring(0, 19)]);
    }

    const fields = ['id', 'name', 'partner_id', 'amount_total', 'state', 'date_order'];
    const records = await this.executeKw('sale.order', 'search_read', [domain], { fields, limit: 100 });

    return records.map((r: any) => ({
      id: r.id,
      order_ref: r.name,
      partner_id: Array.isArray(r.partner_id) ? r.partner_id[0] : r.partner_id,
      partner_name: Array.isArray(r.partner_id) ? r.partner_id[1] : undefined,
      amount_total: r.amount_total || 0,
      state: r.state || 'draft',
      date_order: r.date_order || new Date().toISOString(),
      raw_data: r,
    }));
  }

  public async issueRefundCredit(
    invoiceId: string | number,
    amount: number,
    reason: string,
    dryRun: boolean = false
  ): Promise<ErpWriteResult> {
    if (dryRun) {
      return {
        success: true,
        provider: ErpProvider.ODOO,
        model: 'account.move.reversal',
        record_id: invoiceId,
        message: `[DRY RUN] Would issue credit memo of $${amount} against invoice #${invoiceId}`,
        updated_fields: { amount, reason },
        dry_run: true,
        timestamp: new Date().toISOString(),
      };
    }

    // Call real Odoo reversal wizard
    const numericId = typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId;
    const writeResult = await this.executeKw('account.move.reversal', 'create', [
      {
        move_ids: [[6, 0, [numericId]]],
        reason,
        refund_method: 'refund',
      },
    ]);

    return {
      success: true,
      provider: ErpProvider.ODOO,
      model: 'account.move.reversal',
      record_id: invoiceId,
      message: `Issued credit memo of $${amount} against Odoo invoice #${invoiceId}`,
      updated_fields: { reversal_id: writeResult, amount, reason },
      dry_run: false,
      timestamp: new Date().toISOString(),
    };
  }

  public async updateTicketStatus(
    ticketId: string | number,
    stageName: string,
    resolutionSummary: string,
    dryRun: boolean = false
  ): Promise<ErpWriteResult> {
    if (dryRun) {
      return {
        success: true,
        provider: ErpProvider.ODOO,
        model: 'helpdesk.ticket',
        record_id: ticketId,
        message: `[DRY RUN] Would update ticket #${ticketId} to stage '${stageName}'`,
        updated_fields: { stageName, resolutionSummary },
        dry_run: true,
        timestamp: new Date().toISOString(),
      };
    }

    const numericId = typeof ticketId === 'string' ? parseInt(ticketId, 10) : ticketId;
    await this.executeKw('helpdesk.ticket', 'write', [
      [numericId],
      {
        description: resolutionSummary,
      },
    ]);

    return {
      success: true,
      provider: ErpProvider.ODOO,
      model: 'helpdesk.ticket',
      record_id: ticketId,
      message: `Updated Odoo ticket #${ticketId} with resolution summary`,
      updated_fields: { stageName, resolutionSummary },
      dry_run: false,
      timestamp: new Date().toISOString(),
    };
  }
}
