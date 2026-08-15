import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getPlans, subscribe, cancelSubscription, getPaymentHistory, getInvoice } from '../controllers/subscription.controller';

const router = Router();
router.use(authenticate);

router.get('/plans', getPlans);
router.post('/subscribe', subscribe);
router.delete('/cancel', cancelSubscription);
router.get('/payments', getPaymentHistory);
router.get('/payments/:id/invoice', getInvoice);

export default router;
