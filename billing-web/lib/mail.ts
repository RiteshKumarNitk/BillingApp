import nodemailer from 'nodemailer';

// Configure transport using environment variables, or fallback to Ethereal/test config
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"BillingApp Support" <support@billingapp.com>',
      to,
      subject,
      html,
    });
    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

// Templates
export const EmailTemplates = {
  InvoicePaid: (name: string, invoiceNumber: string, amount: number) => `
    <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #4F46E5;">Payment Received!</h2>
      <p>Hi ${name},</p>
      <p>We've successfully received your payment of <strong>₹${amount.toFixed(2)}</strong> for invoice <strong>#${invoiceNumber}</strong>.</p>
      <p>Your subscription is active and your account is in good standing.</p>
      <p>Thank you for your business!</p>
      <br />
      <p style="color: #6B7280; font-size: 12px;">BillingApp Support</p>
    </div>
  `,
  SubscriptionExpiring: (name: string, daysLeft: number) => `
    <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #F59E0B;">Subscription Expiring Soon</h2>
      <p>Hi ${name},</p>
      <p>Your SaaS subscription is expiring in <strong>${daysLeft} days</strong>.</p>
      <p>Please log in to your dashboard to renew your plan and avoid any service interruptions.</p>
      <br />
      <p style="color: #6B7280; font-size: 12px;">BillingApp Support</p>
    </div>
  `,
  PaymentFailed: (name: string, invoiceNumber: string, attempts: number) => `
    <div style="font-family: sans-serif; max-w: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #EF4444;">Payment Action Required</h2>
      <p>Hi ${name},</p>
      <p>We were unable to process your payment for invoice <strong>#${invoiceNumber}</strong> (Attempt ${attempts} of 3).</p>
      <p>Please update your payment method immediately. If payment is not received, your services may be suspended.</p>
      <br />
      <p style="color: #6B7280; font-size: 12px;">BillingApp Support</p>
    </div>
  `,
};
