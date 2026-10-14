import mongoose, { Schema, Document, Types } from 'mongoose';
import { TicketChannel, TicketCategory, TicketSeverity, TicketStatus } from '@nexora/core';

export interface ITicketDoc extends Document {
  organization_id: Types.ObjectId;
  account_id: Types.ObjectId;
  contact_id?: Types.ObjectId;
  erp_id?: string;
  ticket_number: string;
  channel: TicketChannel;
  subject: string;
  messages: Array<{
    sender_type: 'CUSTOMER' | 'AGENT' | 'AI_BOT';
    sender_name: string;
    content: string;
    timestamp: Date;
    attachments?: string[];
  }>;
  category: TicketCategory;
  severity: TicketSeverity;
  status: TicketStatus;
  confidence_score: number;
  ai_draft_response?: string;
  resolution_summary?: string;
  proposed_action?: {
    action_type: string;
    parameters: Record<string, any>;
    dollar_amount?: number;
    requires_approval: boolean;
  };
  assigned_user_id?: Types.ObjectId;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

const TicketSchema = new Schema<ITicketDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    contact_id: { type: Schema.Types.ObjectId, ref: 'Contact' },
    erp_id: { type: String },
    ticket_number: { type: String, required: true },
    channel: { type: String, enum: Object.values(TicketChannel), default: TicketChannel.CHAT },
    subject: { type: String, required: true, trim: true },
    messages: [
      {
        sender_type: { type: String, enum: ['CUSTOMER', 'AGENT', 'AI_BOT'], required: true },
        sender_name: { type: String, required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        attachments: [{ type: String }],
      },
    ],
    category: { type: String, enum: Object.values(TicketCategory), default: TicketCategory.OTHER },
    severity: { type: String, enum: Object.values(TicketSeverity), default: TicketSeverity.MEDIUM },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.NEW },
    confidence_score: { type: Number, default: 0, min: 0, max: 1 },
    ai_draft_response: { type: String },
    resolution_summary: { type: String },
    proposed_action: {
      action_type: { type: String },
      parameters: { type: Schema.Types.Mixed, default: {} },
      dollar_amount: { type: Number },
      requires_approval: { type: Boolean, default: false },
    },
    assigned_user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    synced_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

TicketSchema.index({ organization_id: 1, ticket_number: 1 }, { unique: true });
TicketSchema.index({ organization_id: 1, status: 1 });
TicketSchema.index({ organization_id: 1, category: 1 });
TicketSchema.index({ organization_id: 1, account_id: 1 });

export const Ticket = mongoose.model<ITicketDoc>('Ticket', TicketSchema);
