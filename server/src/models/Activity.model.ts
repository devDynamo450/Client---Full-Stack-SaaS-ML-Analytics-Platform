import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityDocument extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ['project', 'task', 'user', 'payment', 'subscription'],
    },
    resourceId: {
      type: String,
      required: true,
    },
    details: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ user: 1 });
ActivitySchema.index({ resource: 1, resourceId: 1 });
ActivitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model<IActivityDocument>('Activity', ActivitySchema);
