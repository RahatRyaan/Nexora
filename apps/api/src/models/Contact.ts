import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IContactDoc extends Document {
  organization_id: Types.ObjectId;
  account_id: Types.ObjectId;
  erp_id?: string;
  name: string;
  email: string;
  phone?: string;
  job_title?: string;
  lead_score?: number;
  is_primary: boolean;
  last_contacted_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ContactSchema = new Schema<IContactDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    account_id: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    erp_id: { type: String },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String },
    job_title: { type: String },
    lead_score: { type: Number, default: 50 },
    is_primary: { type: Boolean, default: false },
    last_contacted_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

ContactSchema.index({ organization_id: 1, email: 1 });
ContactSchema.index({ organization_id: 1, account_id: 1 });

export const Contact = mongoose.model<IContactDoc>('Contact', ContactSchema);
