import { AgentType } from '../constants/index.js';

export interface IACPPacketContext {
  account_id?: string;
  contact_id?: string;
  deal_id?: string;
  ticket_id?: string;
  invoice_id?: string;
  erp_sync_status?: string;
  [key: string]: any;
}

export interface IACPPacketEvaluation {
  confidence_score: number; // 0.00 to 1.00
  requires_approval: boolean;
  reasoning: string;
  policy_threshold_breached?: string;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface IACPReversibleMeta {
  is_reversible: boolean;
  rollback_handler: string;
  rollback_payload: Record<string, any>;
}

export interface IACPPacket<T = any> {
  packet_id: string; // UUID v4
  trace_id: string; // Distributed correlation ID
  source_agent: AgentType;
  target_agent: AgentType;
  intent: string;
  timestamp: number;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  organization_id: string;
  context: IACPPacketContext;
  payload: T;
  evaluation: IACPPacketEvaluation;
  reversible_meta?: IACPReversibleMeta;
}
