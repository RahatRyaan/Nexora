import {
  MockErpPartner,
  MockErpInvoice,
  MockErpTicket,
  MockErpSaleOrder,
  initialMockPartners,
  initialMockInvoices,
  initialMockTickets,
  initialMockOrders,
} from './data.js';

export interface MockErpWriteResult {
  success: boolean;
  model: string;
  record_id: number;
  message: string;
  updated_fields: Record<string, any>;
  timestamp: string;
}

export class MockErpServer {
  private partners: MockErpPartner[] = [...initialMockPartners];
  private invoices: MockErpInvoice[] = [...initialMockInvoices];
  private tickets: MockErpTicket[] = [...initialMockTickets];
  private orders: MockErpSaleOrder[] = [...initialMockOrders];
  private writeLog: MockErpWriteResult[] = [];

  // Reset to initial clean state
  public reset(): void {
    this.partners = JSON.parse(JSON.stringify(initialMockPartners));
    this.invoices = JSON.parse(JSON.stringify(initialMockInvoices));
    this.tickets = JSON.parse(JSON.stringify(initialMockTickets));
    this.orders = JSON.parse(JSON.stringify(initialMockOrders));
    this.writeLog = [];
  }

  // Read endpoints
  public getPartners(): MockErpPartner[] {
    return this.partners;
  }

  public getPartnerById(id: number): MockErpPartner | undefined {
    return this.partners.find((p) => p.id === id);
  }

  public getInvoices(partnerId?: number): MockErpInvoice[] {
    if (partnerId) {
      return this.invoices.filter((i) => i.partner_id[0] === partnerId);
    }
    return this.invoices;
  }

  public getTickets(partnerId?: number): MockErpTicket[] {
    if (partnerId) {
      return this.tickets.filter((t) => t.partner_id[0] === partnerId);
    }
    return this.tickets;
  }

  public getOrders(partnerId?: number): MockErpSaleOrder[] {
    if (partnerId) {
      return this.orders.filter((o) => o.partner_id[0] === partnerId);
    }
    return this.orders;
  }

  public getWriteLog(): MockErpWriteResult[] {
    return this.writeLog;
  }

  // Write endpoints (Simulating Odoo XML-RPC / JSON-RPC writes post-approval)
  public issueRefundCredit(invoiceId: number, refundAmount: number, reason: string): MockErpWriteResult {
    const invoice = this.invoices.find((i) => i.id === invoiceId);
    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found in Mock ERP`);
    }

    // Apply credit to invoice
    invoice.amount_residual = Math.max(0, invoice.amount_residual - refundAmount);
    if (invoice.amount_residual === 0) {
      invoice.payment_state = 'paid';
    }

    const result: MockErpWriteResult = {
      success: true,
      model: 'account.move.reversal',
      record_id: invoiceId,
      message: `Issued credit memo of $${refundAmount} against ${invoice.name}. Reason: ${reason}`,
      updated_fields: {
        amount_residual: invoice.amount_residual,
        payment_state: invoice.payment_state,
        refund_amount: refundAmount,
        reason,
      },
      timestamp: new Date().toISOString(),
    };

    this.writeLog.push(result);
    return result;
  }

  public updateTicketStatus(ticketId: number, stageName: string, resolutionSummary: string): MockErpWriteResult {
    const ticket = this.tickets.find((t) => t.id === ticketId);
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found in Mock ERP`);
    }

    ticket.stage_id = [ticket.stage_id[0], stageName];

    const result: MockErpWriteResult = {
      success: true,
      model: 'helpdesk.ticket',
      record_id: ticketId,
      message: `Updated ticket ${ticket.ticket_ref} stage to '${stageName}'`,
      updated_fields: {
        stage_id: ticket.stage_id,
        resolutionSummary,
      },
      timestamp: new Date().toISOString(),
    };

    this.writeLog.push(result);
    return result;
  }
}

export const mockErpInstance = new MockErpServer();
