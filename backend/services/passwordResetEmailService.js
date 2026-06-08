const nodemailer = require('nodemailer');

const cleanText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const createTransport = () => {
  const user = cleanText(process.env.SMTP_USER || process.env.GMAIL_USER);
  const pass = cleanText(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD).replace(/\s/g, '');

  if (!user || !pass) {
    throw new Error('SMTP_USER and SMTP_PASS are required for password reset email delivery');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user, pass },
  });
};

const sendPasswordResetEmail = async ({ user, resetUrl }) => {
  const from = process.env.AUTH_FROM_EMAIL || process.env.SMTP_FROM || `Astravia Team <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;
  const transporter = createTransport();
  const name = cleanText(user?.name, 'Astravia customer');

  const text = [
    `Hello ${name},`,
    '',
    'We received a password reset request.',
    '',
    'Click the link below:',
    resetUrl,
    '',
    'This link expires in 1 hour.',
    '',
    "If you didn't request this, ignore this email.",
    '',
    'Astravia Team',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#050505;color:#f7f2ea;padding:28px;line-height:1.6;">
      <h1 style="margin:0 0 18px;color:#fff;">Reset Your Astravia Password</h1>
      <p>Hello ${escapeHtml(name)},</p>
      <p>We received a password reset request.</p>
      <p>Click the link below:</p>
      <p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#ff1f3d;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700;">Reset Password</a></p>
      <p style="word-break:break-all;color:#c9c9c9;">${escapeHtml(resetUrl)}</p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
      <p>Astravia Team</p>
    </div>
  `;

  const result = await transporter.sendMail({
    from,
    to: user.email,
    subject: 'Reset Your Astravia Password',
    text,
    html,
  });

  return {
    accepted: result.accepted || [],
    messageId: result.messageId,
  };
};

module.exports = {
  sendPasswordResetEmail,
};
