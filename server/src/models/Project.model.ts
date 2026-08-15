import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectDocument extends Document {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  owner: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    joinedAt: Date;
  }[];
  tags: string[];
  dueDate?: Date;
  coverColor: string;
  isPublic: boolean;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'planning',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['owner', 'admin', 'member', 'viewer'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [{ type: String, trim: true }],
    dueDate: Date,
    coverColor: {
      type: String,
      default: '#6366f1',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
ProjectSchema.index({ owner: 1 });
ProjectSchema.index({ 'members.user': 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ tags: 1 });

export const Project = mongoose.model<IProjectDocument>('Project', ProjectSchema);
