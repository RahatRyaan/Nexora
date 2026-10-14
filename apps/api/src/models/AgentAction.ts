import mongoose, { Schema, Document, Types } from 'mongoose';
import { AgentType, ActionRiskLevel, ActionStatus } from '@nexora/core';

export interface IAgentActionDoc extends Document {
  organization_id: Types.ObjectId;
  trace_id: string;
  agent_type: AgentType;
  action_type: string;
  target_entity_type: 'Ticket' | 'Deal' | 'Invoice' | 'Account';
  target_entity_id: Types.ObjectId;
  input_context: Record<string, any>;
  output_payload: Record<string, any>;
  reasoning: string;
  confidence: number;
  risk_level: ActionRiskLevel;
  status: ActionStatus;
  approved_by?: Types.ObjectId;
  approved_at?: Date;
  rejection_reason?: string;
  reversible: boolean;
  rollback_payload?: Record<string, any>;
  execution_error?: string;
  executed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const AgentActionSchema = new Schema<IAgentActionDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    trace_id: { type: String, required: true, index: true },
    agent_type: { type: String, enum: Object.values(AgentType), required: true },
    action_type: { type: String, required: true },
    target_entity_type: { type: String, enum: ['Ticket', 'Deal', 'Invoice', 'Account'], required: true },
    target_entity_id: { type: Schema.Types.ObjectId, required: true, refPath: 'target_entity_type' },
    input_context: { type: Schema.Types.Mixed, default: {} },
    output_payload: { type: Schema.Types.Mixed, default: {} },
    reasoning: { type: String, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    risk_level: { type: String, enum: Object.values(ActionRiskLevel), default: ActionRiskLevel.LOW },
    status: { type: String, enum: Object.values(ActionStatus), default: ActionStatus.PENDING_APPROVAL },
    approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
    approved_at: { type: Date },
    rejection_reason: { type: String },
    reversible: { type: Boolean, default: false },
    rollback_payload: { type: Schema.Types.Mixed },
    execution_error: { type: String },
    executed_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

AgentActionSchema.index({ organization_id: 1, status: 1 });
AgentActionSchema.index({ organization_id: 1, trace_id: 1 });

export const AgentAction = mongoose.model<IAgentActionDoc>('AgentAction', AgentActionSchema);
