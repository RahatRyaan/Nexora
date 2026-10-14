import mongoose, { Schema, Document, Types } from 'mongoose';
import { InvoiceStatus, InvoiceMatchStatus } from '@nexora/core';

export interface IInvoiceDoc extends Document {
  organization_id: Types.ObjectId;
  account_id: Types.ObjectId;
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
  created_at: Date;
  updated_at: Date;
}

const InvoiceSchema = new Schema<IInvoiceDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    erp_id: { type: String, required: true },
    invoice_number: { type: String, required: true },
    po_number: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: Object.values(InvoiceStatus), default: InvoiceStatus.DRAFT },
    match_status: { type: String, enum: Object.values(InvoiceMatchStatus), default: InvoiceMatchStatus.PENDING_DOCUMENTATION },
    match_details: {
      po_amount: { type: Number },
      receipt_amount: { type: Number },
      variance_percentage: { type: Number, default: 0 },
      discrepancy_reasons: [{ type: String }],
    },
    due_date: { type: Date, required: true },
    synced_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

InvoiceSchema.index({ organization_id: 1, invoice_number: 1 });
InvoiceSchema.index({ organization_id: 1, match_status: 1 });
InvoiceSchema.index({ organization_id: 1, status: 1 });

export const Invoice = mongoose.model<IInvoiceDoc>('Invoice', InvoiceSchema);
