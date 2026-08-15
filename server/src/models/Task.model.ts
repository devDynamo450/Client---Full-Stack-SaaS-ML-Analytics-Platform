import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskDocument extends Document {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  dueDate?: Date;
  completedAt?: Date;
  labels: string[];
  comments: {
    _id: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  attachments: {
    _id: mongoose.Types.ObjectId;
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }[];
  estimatedHours?: number;
  loggedHours?: number;
  position: number;
}

const CommentSchema = new Schema(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const AttachmentSchema = new Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: Date,
    completedAt: Date,
    labels: [{ type: String, trim: true }],
    comments: [CommentSchema],
    attachments: [AttachmentSchema],
    estimatedHours: { type: Number, min: 0 },
    loggedHours: { type: Number, min: 0, default: 0 },
    position: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ reporter: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });

// ── Middleware: set completedAt ─────────────────────────────────────────────
TaskSchema.pre('save', function () {
  if (this.isModified('status')) {
    if (this.status === 'done' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'done') {
      this.completedAt = undefined;
    }
  }
});

export const Task = mongoose.model<ITaskDocument>('Task', TaskSchema);
