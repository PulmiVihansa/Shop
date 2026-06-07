const crypto = require('crypto');
const nodemailer = require('nodemailer');

const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const cleanText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
};

const normalizeVoucher = (payload = {}) => {
  const amount = Math.max(0, Number(payload.amount || 0));
  const design = cleanText(payload.design, 'Classic Red');
  const code = cleanText(payload.code, `ASTRAVIA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`);
  const validUntil = cleanText(payload.validUntil, 'One year from purchase');
  const recipient = payload.recipient || {};
  const recipientName = cleanText(recipient.name, 'Astravia customer');
  const recipientEmail = cleanText(recipient.email);
  const message = cleanText(recipient.message, 'A premium Astravia gift voucher is waiting for you.');

  if (!amount) throw new Error('Voucher amount is required');

  return {
    amount,
    design,
    code,
    validUntil,
    recipient: {
      name: recipientName,
      email: recipientEmail,
      message,
    },
  };
};

const buildVoucherHtml = (voucher) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 36px;
        background: #050505;
        color: #f7f2ea;
        font-family: Arial, Helvetica, sans-serif;
      }
      .voucher {
        width: 100%;
        min-height: 720px;
        border: 1px solid rgba(255,255,255,.18);
        border-radius: 28px;
        padding: 54px;
        background:
          radial-gradient(circle at 82% 35%, rgba(255,31,61,.22), transparent 28%),
          linear-gradient(135deg, #070707 0%, #111 52%, #050505 100%);
      }
      .brand {
        color: #fff;
        font-size: 42px;
        font-weight: 800;
        letter-spacing: -.04em;
      }
      .kicker {
        margin-top: 10px;
        color: #ff1f3d;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: .32em;
        text-transform: uppercase;
      }
      h1 {
        margin: 78px 0 0;
        font-size: 86px;
        line-height: .9;
        letter-spacing: .02em;
        text-transform: uppercase;
      }
      .amount {
        margin-top: 28px;
        color: #ff1f3d;
        font-size: 74px;
        font-weight: 900;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-top: 76px;
      }
      .box {
        border: 1px solid rgba(255,255,255,.18);
        padding: 18px;
        background: rgba(255,255,255,.04);
      }
      .box span {
        display: block;
        color: rgba(247,242,234,.58);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .24em;
        text-transform: uppercase;
      }
      .box strong {
        display: block;
        margin-top: 8px;
        color: #fff;
        font-size: 24px;
      }
      .message {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid rgba(255,255,255,.14);
        color: rgba(247,242,234,.74);
        font-size: 18px;
        line-height: 1.6;
      }
      .fineprint {
        margin-top: 30px;
        color: rgba(247,242,234,.42);
        font-size: 12px;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main class="voucher">
      <div class="brand">Astravia</div>
      <div class="kicker">${escapeHtml(voucher.design)} Gift Voucher</div>
      <h1>Gift<br>Voucher</h1>
      <div class="amount">${escapeHtml(money(voucher.amount))}</div>
      <div class="grid">
        <div class="box">
          <span>Recipient</span>
          <strong>${escapeHtml(voucher.recipient.name)}</strong>
        </div>
        <div class="box">
          <span>Valid Until</span>
          <strong>${escapeHtml(voucher.validUntil)}</strong>
        </div>
        <div class="box">
          <span>Voucher Code</span>
          <strong>${escapeHtml(voucher.code)}</strong>
        </div>
        <div class="box">
          <span>Redeemable On</span>
          <strong>All Astravia drops</strong>
        </div>
      </div>
      <div class="message">${escapeHtml(voucher.recipient.message)}</div>
      <div class="fineprint">
        This digital voucher is non-refundable and cannot be exchanged for cash.
        Present the voucher code at checkout to redeem against eligible Astravia products.
      </div>
    </main>
  </body>
</html>`;

const escapePdfText = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildFallbackPdf = (voucher) => {
  const lines = [
    'ASTRAVIA GIFT VOUCHER',
    `Value: ${money(voucher.amount)}`,
    `Code: ${voucher.code}`,
    `Design: ${voucher.design}`,
    `Recipient: ${voucher.recipient.name}`,
    `Valid Until: ${voucher.validUntil}`,
    `Message: ${voucher.recipient.message}`,
  ];
  const content = ['BT', '/F1 14 Tf', '50 790 Td', ...lines.flatMap((line, index) => [
    index === 0 ? '' : '0 -28 Td',
    `(${escapePdfText(line)}) Tj`,
  ]).filter(Boolean), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

const renderVoucherPdf = async (payload) => {
  const voucher = normalizeVoucher(payload);
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });
      await page.setContent(buildVoucherHtml(voucher), { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch {
    return buildFallbackPdf(voucher);
  }
};

const createTransport = () => {
  const user = cleanText(process.env.SMTP_USER || process.env.GMAIL_USER);
  const pass = cleanText(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD).replace(/\s/g, '');
  if (!user || !pass) throw new Error('SMTP_USER and SMTP_PASS are required for voucher email delivery');
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: { user, pass },
  });
};

const sendVoucherEmail = async (payload) => {
  const voucher = normalizeVoucher(payload);
  if (!voucher.recipient.email) throw new Error('Recipient email is required');
  const pdf = await renderVoucherPdf(voucher);
  const transporter = createTransport();
  const from = process.env.VOUCHER_FROM_EMAIL || process.env.SMTP_FROM || `Astravia <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;

  const result = await transporter.sendMail({
    from,
    to: voucher.recipient.email,
    subject: `Your Astravia Gift Voucher - ${voucher.code}`,
    text: [
      `Hi ${voucher.recipient.name},`,
      '',
      'You received an Astravia gift voucher.',
      `Value: ${money(voucher.amount)}`,
      `Code: ${voucher.code}`,
      `Valid Until: ${voucher.validUntil}`,
      '',
      voucher.recipient.message,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;background:#050505;color:#f7f2ea;padding:28px;">
        <h1 style="margin:0 0 12px;color:#fff;">Astravia Gift Voucher</h1>
        <p style="color:#ff1f3d;font-size:24px;font-weight:800;">${escapeHtml(money(voucher.amount))}</p>
        <p>Hi <strong>${escapeHtml(voucher.recipient.name)}</strong>,</p>
        <p>${escapeHtml(voucher.recipient.message)}</p>
        <p><strong>Voucher code:</strong> ${escapeHtml(voucher.code)}</p>
        <p><strong>Valid until:</strong> ${escapeHtml(voucher.validUntil)}</p>
        <p style="color:#aaa;">Your PDF voucher is attached.</p>
      </div>
    `,
    attachments: [{
      filename: `Astravia-${voucher.code}.pdf`,
      content: pdf,
      contentType: 'application/pdf',
    }],
  });

  return {
    accepted: result.accepted || [],
    messageId: result.messageId,
  };
};

module.exports = {
  normalizeVoucher,
  renderVoucherPdf,
  sendVoucherEmail,
};
