import mongoose, { Schema, Document, Types } from 'mongoose';
import { DealStage } from '@nexora/core';

export interface IDealDoc extends Document {
  organization_id: Types.ObjectId;
  account_id: Types.ObjectId;
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
  created_at: Date;
  updated_at: Date;
}

const DealSchema = new Schema<IDealDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    erp_id: { type: String },
    name: { type: String, required: true, trim: true },
    stage: { type: String, enum: Object.values(DealStage), default: DealStage.PROSPECTING },
    value: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    source: { type: String, default: 'INBOUND' },
    intent_score: { type: Number, default: 0.5, min: 0, max: 1 },
    intent_signals: [
      {
        signal: { type: String, required: true },
        detected_at: { type: Date, default: Date.now },
        source: { type: String, default: 'AGENT_OBSERVER' },
      },
    ],
    expected_close_date: { type: Date },
    synced_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

DealSchema.index({ organization_id: 1, stage: 1 });
DealSchema.index({ organization_id: 1, account_id: 1 });

export const Deal = mongoose.model<IDealDoc>('Deal', DealSchema);
