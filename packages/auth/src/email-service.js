import nodemailer from 'nodemailer';

function smtpEnabled() {
  return Boolean(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS);
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL || process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/$/, '');
}

function fromAddress() {
  return process.env.EMAIL_FROM || 'Rumbo <no-reply@localhost>';
}

function createTransporter() {
  if (!smtpEnabled()) return null;
  return nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_HOST,
    port: Number.parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
    secure: String(process.env.EMAIL_SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  });
}

export function buildAbsoluteUrl(path) {
  if (/^https?:\/\//.test(path)) return path;
  return `${appBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function sendEmail({ to, subject, text, html }) {
  const transportMode = (process.env.EMAIL_TRANSPORT || '').toLowerCase();
  const transporter = transportMode === 'log' ? null : createTransporter();

  if (!transporter) {
    console.log(`[email:${transportMode || 'log'}] to=${to} subject=${subject}`);
    return { delivered: false, logged: true };
  }

  const result = await transporter.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, messageId: result.messageId };
}
