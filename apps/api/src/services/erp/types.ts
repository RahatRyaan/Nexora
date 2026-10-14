import { ErpProvider } from '@nexora/core';

export interface ErpConnectionConfig {
  provider: ErpProvider;
  host: string;
  db?: string;
  username?: string;
  password?: string;
  timeoutMs?: number;
}

export interface ErpPartner {
  id: string | number;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  city?: string;
  credit_limit?: number;
  total_due?: number;
  customer_rank?: number;
  raw_data?: Record<string, any>;
}

export interface ErpInvoice {
  id: string | number;
  invoice_number: string;
  partner_id: string | number;
  partner_name?: string;
  amount_total: number;
  amount_residual: number;
  state: 'draft' | 'posted' | 'cancel' | string;
  payment_state: 'not_paid' | 'in_payment' | 'paid' | 'partial' | string;
  invoice_date: string;
  invoice_date_due: string;
  po_number?: string;
  raw_data?: Record<string, any>;
}

export interface ErpTicket {
  id: string | number;
  ticket_ref: string;
  name: string;
  partner_id?: string | number;
  partner_email?: string;
  stage_name: string;
  priority: string;
  description: string;
  create_date: string;
  raw_data?: Record<string, any>;
}

export interface ErpSaleOrder {
  id: string | number;
  order_ref: string;
  partner_id: string | number;
  partner_name?: string;
  amount_total: number;
  state: string;
  date_order: string;
  raw_data?: Record<string, any>;
}

export interface ErpWriteResult {
  success: boolean;
  provider: ErpProvider;
  model: string;
  record_id: string | number;
  message: string;
  updated_fields: Record<string, any>;
  dry_run: boolean;
  timestamp: string;
}

export interface ErpSyncStats {
  started_at: Date;
  completed_at: Date;
  duration_ms: number;
  partners_synced: number;
  invoices_synced: number;
  tickets_synced: number;
  deals_synced: number;
  errors: string[];
}

export interface IErpConnector {
  testConnection(): Promise<{ success: boolean; message: string; details?: any }>;
  fetchPartners(since?: Date): Promise<ErpPartner[]>;
  fetchInvoices(since?: Date): Promise<ErpInvoice[]>;
  fetchTickets(since?: Date): Promise<ErpTicket[]>;
  fetchSaleOrders(since?: Date): Promise<ErpSaleOrder[]>;
  issueRefundCredit(invoiceId: string | number, amount: number, reason: string, dryRun?: boolean): Promise<ErpWriteResult>;
  updateTicketStatus(ticketId: string | number, stageName: string, resolutionSummary: string, dryRun?: boolean): Promise<ErpWriteResult>;
}
