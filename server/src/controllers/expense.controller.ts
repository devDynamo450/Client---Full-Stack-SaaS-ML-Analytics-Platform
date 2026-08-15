import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Expense } from '../models/Expense.model';

export const addExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { amount, category, date, description } = req.body;

    const expense = await Expense.create({
      user: userId,
      amount,
      category,
      date: date || new Date(),
      description,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const expenses = await Expense.find({ user: userId }).sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMlPrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    
    // Fetch user expenses
    const expenses = await Expense.find({ user: userId }).sort({ date: 1 });
    
    // Check if enough data
    if (expenses.length < 2) {
      res.json({ 
        success: false, 
        error: "Not enough data. Please add at least 2 expenses in different months to generate a prediction." 
      });
      return;
    }

    // Prepare data for ML service
    const mlData = {
      userId,
      expenses: expenses.map(e => ({
        amount: e.amount,
        date: e.date.toISOString(),
        category: e.category,
      }))
    };

    // Call Python ML Service
    try {
      const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      const mlResponse = await fetch(`${mlUrl}/api/ml/predict-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mlData)
      });
      
      const result = await mlResponse.json();
      res.json(result);
    } catch (mlError) {
      console.error("ML Service Error:", mlError);
      res.status(503).json({ success: false, error: "ML Service is currently unavailable." });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
