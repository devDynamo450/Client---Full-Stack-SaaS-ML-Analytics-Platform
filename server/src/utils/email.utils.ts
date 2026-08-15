import nodemailer from 'nodemailer';

// Mock/test transport using ethereal.email or falling back to console if not provided
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    if (!process.env.SMTP_USER) {
      console.log('📧 [SIMULATED EMAIL]', { to, subject, htmlPreview: html.substring(0, 100) + '...' });
      return;
    }
    
    const info = await transporter.sendMail({
      from: '"ProjectFlow" <noreply@projectflow.com>',
      to,
      subject,
      html,
    });
    
    console.log(`📧 Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};

export const sendSubscriptionReceipt = async (userEmail: string, planName: string, amount: number, transactionId: string): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>ProjectFlow Subscription Receipt</h2>
      <p>Thank you for upgrading to the <strong>${planName}</strong> plan!</p>
      <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Amount Paid:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p>You can view your full billing history and invoices in your ProjectFlow dashboard.</p>
    </div>
  `;
  await sendEmail(userEmail, `Receipt: ${planName} Plan Subscription`, html);
};

export const sendSubscriptionCancellation = async (userEmail: string): Promise<void> => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>ProjectFlow Subscription Cancelled</h2>
      <p>Your subscription has been successfully cancelled. You will continue to have access to your current plan features until the end of your billing cycle.</p>
      <p>We're sorry to see you go. If you change your mind, you can resubscribe at any time from your dashboard.</p>
    </div>
  `;
  await sendEmail(userEmail, 'ProjectFlow Subscription Cancelled', html);
};
