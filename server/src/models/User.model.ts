import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'member' | 'guest';
  avatar?: string;
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'inactive' | 'cancelled' | 'trial';
    startDate: Date;
    endDate?: Date;
    trialEndsAt?: Date;
  };
  isActive: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'manager', 'member', 'guest'],
      default: 'member',
    },
    avatar: {
      type: String,
      default: '',
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'pro', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'cancelled', 'trial'],
        default: 'active',
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: Date,
      trialEndsAt: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'subscription.plan': 1 });

// ── Pre-save hook: Hash password ───────────────────────────────────────────
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  this.password = await bcrypt.hash(this.password, rounds);
});

// ── Instance method: Compare password ─────────────────────────────────────
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
