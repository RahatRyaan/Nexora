import {
  UserRole,
  AccountTier,
  DealStage,
  TicketChannel,
  TicketCategory,
  TicketSeverity,
  TicketStatus,
  InvoiceStatus,
  InvoiceMatchStatus,
  TransactionType,
  ActionRiskLevel,
  ActionStatus,
  ErpProvider,
  AgentType
} from '../constants/index.js';

export interface IOrganizationApprovalPolicies {
  support_refund_limit_dollars: number;
  support_confidence_threshold: number;
  sales_auto_outreach_threshold: number;
  finance_strict_human_approval: boolean;
}

export interface IOrganizationErpConfig {
  provider: ErpProvider;
  host: string;
  db?: string;
  encrypted_credentials?: string;
  sync_interval_mins: number;
  last_synced_at?: Date;
  status: 'connected' | 'disconnected' | 'error';
  field_mappings?: Record<string, string>;
}

export interface IOrganizationEntity {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  timezone: string;
  approval_policies: IOrganizationApprovalPolicies;
  erp_config: IOrganizationErpConfig;
  created_at: Date;
  updated_at: Date;
}

export interface IUserEntity {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  notification_preferences: {
    email_on_escalation: boolean;
    email_on_approval_queued: boolean;
  };
  last_login_at?: Date;
  created_at: Date;
}

export interface IAccountEntity {
  id: string;
  organization_id: string;
  erp_id: string;
  name: string;
  industry?: string;
  tier: AccountTier;
  health_score: number;
  annual_revenue?: number;
  assigned_owner_id?: string;
  open_deals_count: number;
  open_tickets_count: number;
  overdue_invoices_count: number;
  last_synced_at: Date;
  metadata?: Record<string, any>;
}

export interface IContactEntity {
  id: string;
  organization_id: string;
  account_id: string;
  erp_id?: string;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  lead_score?: number;
  is_primary: boolean;
  last_contacted_at?: Date;
}

export interface IDealEntity {
  id: string;
  organization_id: string;
  account_id: string;
  erp_id?: string;
  name: string;
  stage: DealStage;
  value: number;
  currency: string;
  source: string;
  intent_score: number;
  intent_signals: Array<{
    signal: string;
    detected_at: Date;
    source: string;
  }>;
  expected_close_date?: Date;
  synced_at: Date;
}

export interface ITicketMessage {
  sender_type: 'CUSTOMER' | 'AGENT' | 'AI_BOT';
  sender_name: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
}

export interface ITicketProposedAction {
  action_type: string;
  parameters: Record<string, any>;
  dollar_amount?: number;
  requires_approval: boolean;
}

export interface ITicketEntity {
  id: string;
  organization_id: string;
  account_id: string;
  contact_id?: string;
  erp_id?: string;
  ticket_number: string;
  channel: TicketChannel;
  subject: string;
  messages: ITicketMessage[];
  category: TicketCategory;
  severity: TicketSeverity;
  status: TicketStatus;
  confidence_score: number;
  ai_draft_response?: string;
  resolution_summary?: string;
  proposed_action?: ITicketProposedAction;
  assigned_user_id?: string;
  synced_at: Date;
}

export interface IInvoiceEntity {
  id: string;
  organization_id: string;
  account_id: string;
  erp_id: string;
  invoice_number: string;
  po_number?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  match_status: InvoiceMatchStatus;
  match_details?: {
    po_amount?: number;
    receipt_amount?: number;
    variance_percentage: number;
    discrepancy_reasons: string[];
  };
  due_date: Date;
  synced_at: Date;
}

export interface ITransactionEntity {
  id: string;
  organization_id: string;
  invoice_id?: string;
  account_id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  flagged: boolean;
  flag_reason?: string;
  erp_transaction_id?: string;
  created_at: Date;
}

export interface IAgentActionEntity {
  id: string;
  organization_id: string;
  trace_id: string;
  agent_type: AgentType;
  action_type: string;
  target_entity_type: 'Ticket' | 'Deal' | 'Invoice' | 'Account';
  target_entity_id: string;
  input_context: Record<string, any>;
  output_payload: Record<string, any>;
  reasoning: string;
  confidence: number;
  risk_level: ActionRiskLevel;
  status: ActionStatus;
  approved_by?: string;
  approved_at?: Date;
  rejection_reason?: string;
  reversible: boolean;
  rollback_payload?: Record<string, any>;
  execution_error?: string;
  executed_at?: Date;
  created_at: Date;
}

export interface IAuditLogEntity {
  id: string;
  organization_id: string;
  trace_id: string;
  action_id?: string;
  actor_type: 'AI_AGENT' | 'USER' | 'SYSTEM';
  actor_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  state_before?: Record<string, any>;
  state_after?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}
