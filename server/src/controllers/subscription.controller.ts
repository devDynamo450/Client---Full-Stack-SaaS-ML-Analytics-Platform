import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/User.model';
import { Payment } from '../models/Payment.model';
import { Activity } from '../models/Activity.model';
import { Notification } from '../models/Notification.model';
import { generateTransactionId } from '../utils/jwt.utils';
import { PLANS, PLAN_FEATURES } from '../utils/plans.utils';
import { sendSubscriptionReceipt, sendSubscriptionCancellation } from '../utils/email.utils';

// GET /api/subscriptions/plans
export const getPlans = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, data: PLANS });
};

// POST /api/subscriptions/subscribe
export const subscribe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { planId, cardNumber, cardExpiry, cardCVC } = req.body;

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      res.status(400).json({ success: false, error: 'Invalid plan' });
      return;
    }

    // Simulate payment processing
    const cardLast4 = (cardNumber || '').replace(/\s/g, '').slice(-4);
    const isPaymentSuccessful = cardNumber !== '4000000000000002'; // Simulate decline

    if (!isPaymentSuccessful && plan.price > 0) {
      await Payment.create({
        user: userId,
        amount: plan.price,
        currency: 'USD',
        status: 'failed',
        plan: planId,
        transactionId: generateTransactionId(),
        description: `Failed payment for ${plan.name} plan`,
      });
      res.status(402).json({ success: false, error: 'Payment declined. Please check your card details.' });
      return;
    }

    const transactionId = generateTransactionId();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Record payment
    if (plan.price > 0) {
      await Payment.create({
        user: userId,
        amount: plan.price,
        currency: 'USD',
        status: 'completed',
        plan: planId,
        transactionId,
        description: `${plan.name} plan subscription`,
        metadata: { cardLast4, billingCycle: plan.billingCycle },
      });
      
      const userDoc = await User.findById(userId);
      if (userDoc) {
        await sendSubscriptionReceipt(userDoc.email, plan.name, plan.price, transactionId);
      }
    }

    // Update user subscription
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'subscription.plan': planId,
        'subscription.status': 'active',
        'subscription.startDate': new Date(),
        'subscription.endDate': endDate,
      },
      { new: true }
    );

    await Activity.create({
      user: userId,
      action: 'subscribed',
      resource: 'subscription',
      resourceId: userId,
      details: { plan: planId, amount: plan.price },
    });

    await Notification.create({
      user: userId,
      title: 'Subscription activated!',
      message: `You are now on the ${plan.name} plan. Enjoy your new features!`,
      type: 'success',
    });

    res.json({
      success: true,
      message: `Successfully subscribed to ${plan.name} plan!`,
      data: {
        subscription: user?.subscription,
        transactionId,
        features: PLAN_FEATURES[planId],
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/subscriptions/cancel
export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId;

    await User.findByIdAndUpdate(userId, {
      'subscription.status': 'cancelled',
    });

    await Notification.create({
      user: userId,
      title: 'Subscription cancelled',
      message: 'Your subscription has been cancelled. You will retain access until your billing period ends.',
      type: 'warning',
    });

    const user = await User.findById(userId);
    if (user) {
      await sendSubscriptionCancellation(user.email);
    }

    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/subscriptions/payments
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ user: req.user!.userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: payments });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/subscriptions/payments/:id/invoice
export const getInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paymentId = req.params.id;
    const payment = await Payment.findOne({ _id: paymentId, user: req.user!.userId }).populate('user', 'name email');
    
    if (!payment) {
      res.status(404).json({ success: false, error: 'Payment not found' });
      return;
    }

    const user = payment.user as unknown as { name: string, email: string };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${payment.transactionId}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .header h2 { margin: 0; color: #6366f1; }
          .details { margin-bottom: 40px; display: flex; justify-content: space-between; }
          .table { width: 100%; text-align: left; border-collapse: collapse; }
          .table th, .table td { padding: 12px; border-bottom: 1px solid #eee; }
          .table th { background: #f9fafb; }
          .total { text-align: right; margin-top: 20px; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <h2>ProjectFlow</h2>
            <div>
              <strong>Invoice #:</strong> ${payment._id}<br>
              <strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}<br>
              <strong>Status:</strong> <span style="text-transform: uppercase;">${payment.status}</span>
            </div>
          </div>
          <div class="details">
            <div>
              <strong>Billed To:</strong><br>
              ${user.name}<br>
              ${user.email}
            </div>
            <div>
              <strong>Transaction ID:</strong><br>
              ${payment.transactionId}
            </div>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Plan</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${payment.description}</td>
                <td style="text-transform: capitalize;">${payment.plan}</td>
                <td style="text-align: right;">$${payment.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">
            Total: $${payment.amount.toFixed(2)} ${payment.currency}
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
};

