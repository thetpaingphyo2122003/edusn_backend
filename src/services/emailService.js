const nodemailer = require('nodemailer');

const hasSmtpConfig =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

let transporter = null;

const normalizeSmtpPassword = (password = '') => String(password).replace(/\s/g, '');

if (hasSmtpConfig) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: normalizeSmtpPassword(process.env.SMTP_PASS),
    },
  });
}

const sendEmail = async ({ to, subject, text, html }) => {
  if (!transporter) {
    throw new Error('SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to send OTP emails.');
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return { skipped: false };
};

module.exports = {
  sendEmail,
};

