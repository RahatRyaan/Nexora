import mongoose, { Schema, Document, Types } from 'mongoose';
import { AccountTier } from '@nexora/core';

export interface IAccountDoc extends Document {
  organization_id: Types.ObjectId;
  erp_id: string;
  name: string;
  industry?: string;
  tier: AccountTier;
  health_score: number;
  annual_revenue?: number;
  assigned_owner_id?: Types.ObjectId;
  open_deals_count: number;
  open_tickets_count: number;
  overdue_invoices_count: number;
  last_synced_at: Date;
  metadata?: Map<string, any>;
  created_at: Date;
  updated_at: Date;
}

const AccountSchema = new Schema<IAccountDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    erp_id: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    industry: { type: String },
    tier: { type: String, enum: Object.values(AccountTier), default: AccountTier.MID_MARKET },
    health_score: { type: Number, default: 80, min: 0, max: 100 },
    annual_revenue: { type: Number },
    assigned_owner_id: { type: Schema.Types.ObjectId, ref: 'User' },
    open_deals_count: { type: Number, default: 0 },
    open_tickets_count: { type: Number, default: 0 },
    overdue_invoices_count: { type: Number, default: 0 },
    last_synced_at: { type: Date, default: Date.now },
    metadata: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Compound indexes for sub-millisecond retrieval
AccountSchema.index({ organization_id: 1, erp_id: 1 }, { unique: true });
AccountSchema.index({ organization_id: 1, health_score: 1 });
AccountSchema.index({ organization_id: 1, tier: 1 });

export const Account = mongoose.model<IAccountDoc>('Account', AccountSchema);
