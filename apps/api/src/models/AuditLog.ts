import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLogDoc extends Document {
  organization_id: Types.ObjectId;
  trace_id: string;
  action_id?: Types.ObjectId;
  actor_type: 'AI_AGENT' | 'USER' | 'SYSTEM';
  actor_id: string;
  actor_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  state_before?: Record<string, any>;
  state_after?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    organization_id: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    trace_id: { type: String, required: true, index: true },
    action_id: { type: Schema.Types.ObjectId, ref: 'AgentAction' },
    actor_type: { type: String, enum: ['AI_AGENT', 'USER', 'SYSTEM'], required: true },
    actor_id: { type: String, required: true },
    actor_name: { type: String, required: true },
    action: { type: String, required: true },
    resource_type: { type: String, required: true },
    resource_id: { type: String, required: true },
    state_before: { type: Schema.Types.Mixed },
    state_after: { type: Schema.Types.Mixed },
    ip_address: { type: String },
    user_agent: { type: String },
    timestamp: { type: Date, default: Date.now, immutable: true },
  },
  { timestamps: false }
);

// Append-only invariant enforcement
AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('AuditLog entries are immutable and cannot be updated.'));
  }
  next();
});

AuditLogSchema.index({ organization_id: 1, timestamp: -1 });
AuditLogSchema.index({ organization_id: 1, resource_id: 1 });

export const AuditLog = mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);
