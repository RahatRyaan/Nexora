import mongoose, { Schema, Document } from 'mongoose';
import { ErpProvider } from '@nexora/core';

export interface IOrganizationDoc extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  timezone: string;
  approval_policies: {
    support_refund_limit_dollars: number;
    support_confidence_threshold: number;
    sales_auto_outreach_threshold: number;
    finance_strict_human_approval: boolean;
  };
  erp_config: {
    provider: ErpProvider;
    host: string;
    db?: string;
    encrypted_credentials?: string;
    sync_interval_mins: number;
    last_synced_at?: Date;
    status: 'connected' | 'disconnected' | 'error';
    field_mappings: Map<string, string>;
  };
  created_at: Date;
  updated_at: Date;
}

const OrganizationSchema = new Schema<IOrganizationDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String },
    timezone: { type: String, default: 'UTC' },
    approval_policies: {
      support_refund_limit_dollars: { type: Number, default: 100 },
      support_confidence_threshold: { type: Number, default: 0.85 },
      sales_auto_outreach_threshold: { type: Number, default: 0.90 },
      finance_strict_human_approval: { type: Boolean, default: true, immutable: true }, // Hard Invariant
    },
    erp_config: {
      provider: { type: String, enum: Object.values(ErpProvider), default: ErpProvider.MOCK },
      host: { type: String, default: 'http://localhost:5050' },
      db: { type: String, default: 'mock_odoo_db' },
      encrypted_credentials: { type: String },
      sync_interval_mins: { type: Number, default: 15 },
      last_synced_at: { type: Date },
      status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'connected' },
      field_mappings: { type: Map, of: String, default: {} },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const Organization = mongoose.model<IOrganizationDoc>('Organization', OrganizationSchema);
