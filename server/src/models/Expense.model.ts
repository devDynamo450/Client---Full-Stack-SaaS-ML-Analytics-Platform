import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseDocument extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  category: string;
  date: Date;
  description: string;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

ExpenseSchema.index({ user: 1, date: -1 });

export const Expense = mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);
