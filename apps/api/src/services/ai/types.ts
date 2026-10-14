import { TicketCategory, TicketSeverity, TicketStatus } from '@nexora/core';

export interface SupportTriageResult {
  category: TicketCategory;
  severity: TicketSeverity;
  confidence_score: number; // 0.00 to 1.00
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'ANGRY';
  reasoning: string;
  draft_response: string;
  resolution_summary: string;
  proposed_action?: {
    action_type: 'ISSUE_REFUND' | 'EXTEND_CREDIT' | 'UPGRADE_TIER' | 'STATUS_UPDATE' | 'NONE';
    parameters: Record<string, any>;
    dollar_amount?: number;
    requires_approval: boolean;
  };
}

export interface SupportContextPayload {
  account: {
    id: string;
    erp_id: string;
    name: string;
    tier: string;
    health_score: number;
    annual_revenue?: number;
  };
  contact?: {
    name: string;
    email: string;
    phone?: string;
    job_title?: string;
  };
  open_deals: Array<{
    name: string;
    value: number;
    stage: string;
  }>;
  recent_invoices: Array<{
    invoice_number: string;
    amount: number;
    status: string;
    due_date: string;
  }>;
  ticket_history: Array<{
    ticket_number: string;
    subject: string;
    status: string;
  }>;
  customer_message: string;
  channel: string;
}
