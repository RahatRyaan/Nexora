import mongoose, { Schema, Document, Types } from 'mongoose';
import { TransactionType } from '@nexora/core';

export interface ITransactionDoc extends Document {
  organization_id: Types.ObjectId;
  invoice_id?: Types.ObjectId;
  account_id: Types.ObjectId;
  amount: number;
  currency: string;
  type: TransactionType;
  flagged: boolean;
  flag_reason?: string;
  erp_transaction_id?: string;
  created_at: Date;
}

const TransactionSchema = new Schema<ITransactionDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    invoice_id: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: Object.values(TransactionType), default: TransactionType.PAYMENT },
    flagged: { type: Boolean, default: false },
    flag_reason: { type: String },
    erp_transaction_id: { type: String },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

TransactionSchema.index({ organization_id: 1, flagged: 1 });

export const Transaction = mongoose.model<ITransactionDoc>('Transaction', TransactionSchema);
