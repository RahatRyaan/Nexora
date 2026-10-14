import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '@nexora/core';
import bcrypt from 'bcryptjs';

export interface IUserDoc extends Document {
  organization_id: Types.ObjectId;
  email: string;
  password_hash: string;
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
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.VIEWER },
    avatar_url: { type: String },
    is_active: { type: Boolean, default: true },
    notification_preferences: {
      email_on_escalation: { type: Boolean, default: true },
      email_on_approval_queued: { type: Boolean, default: true },
    },
    last_login_at: { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

// Password comparison method
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password_hash);
};

export const User = mongoose.model<IUserDoc>('User', UserSchema);
