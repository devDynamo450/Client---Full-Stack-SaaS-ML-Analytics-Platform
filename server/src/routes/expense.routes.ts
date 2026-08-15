import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { addExpense, getExpenses, getMlPrediction } from '../controllers/expense.controller';

const router = Router();
router.use(authenticate);

router.post('/', addExpense);
router.get('/', getExpenses);
router.get('/predict', getMlPrediction);

export default router;
