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
    throw new Error('SMTP_USER and SMTP_PASS are required for contact form email delivery');
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user, pass },
  });
};

const normalizeContactMessage = (payload = {}) => {
  const name = cleanText(payload.name, 'Customer');
  const email = cleanText(payload.email);
  const order = cleanText(payload.order);
  const department = cleanText(payload.department, 'General');
  const subject = cleanText(payload.subject, 'Contact form message');
  const message = cleanText(payload.message);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('A valid email is required');
  }
  if (!message) {
    throw new Error('Message is required');
  }

  return {
    name,
    email,
    order,
    department,
    subject,
    message,
  };
};

const contactRecipient = () =>
  cleanText(
    process.env.CONTACT_TO_EMAIL ||
    process.env.SUPPORT_EMAIL ||
    process.env.SMTP_USER ||
    process.env.GMAIL_USER
  );

const sendContactEmail = async (payload) => {
  const contact = normalizeContactMessage(payload);
  const to = contactRecipient();
  if (!to) throw new Error('CONTACT_TO_EMAIL or SMTP_USER must be configured');

  const transporter = createTransport();
  const reference = `AST-${Date.now().toString().slice(-6)}`;
  const from = process.env.CONTACT_FROM_EMAIL || process.env.SMTP_FROM || `Astravia Contact <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;
  const subject = `[Astravia Contact] ${contact.department} - ${contact.subject}`;

  const text = [
    `Reference: ${reference}`,
    `Department: ${contact.department}`,
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Order ID: ${contact.order || '-'}`,
    `Subject: ${contact.subject}`,
    '',
    contact.message,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;background:#050505;color:#f7f2ea;padding:28px;">
      <h1 style="margin:0 0 14px;color:#fff;">Astravia Contact Message</h1>
      <p style="margin:0 0 20px;color:#ff1f3d;font-weight:700;">Reference ${escapeHtml(reference)}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${[
          ['Department', contact.department],
          ['Name', contact.name],
          ['Email', contact.email],
          ['Order ID', contact.order || '-'],
          ['Subject', contact.subject],
        ].map(([label, value]) => `
          <tr>
            <td style="padding:8px 10px;border:1px solid rgba(255,255,255,.12);color:#aaa;">${escapeHtml(label)}</td>
            <td style="padding:8px 10px;border:1px solid rgba(255,255,255,.12);color:#fff;">${escapeHtml(value)}</td>
          </tr>
        `).join('')}
      </table>
      <div style="white-space:pre-wrap;line-height:1.6;color:#f7f2ea;">${escapeHtml(contact.message)}</div>
    </div>
  `;

  const result = await transporter.sendMail({
    from,
    to,
    replyTo: contact.email,
    subject,
    text,
    html,
  });

  return {
    reference,
    accepted: result.accepted || [],
    messageId: result.messageId,
  };
};

module.exports = {
  normalizeContactMessage,
  sendContactEmail,
};
