const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const nodemailer = require('nodemailer');
const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');

const voucherStorageDir = path.join(__dirname, '..', 'storage', 'gift-vouchers');
const paymentRequiredMessage = 'Please complete voucher payment first.';

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

const publicVoucherPdfUrl = (voucherCode) => `/storage/gift-vouchers/Astravia-${voucherCode}.pdf`;

const normalizeEmail = (value) => cleanText(value).toLowerCase();

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

const normalizeVoucherIntent = (payload = {}) => {
  const recipient = payload.recipient || {};
  const amount = Math.max(0, Number(payload.amount || 0));
  const recipientName = cleanText(recipient.name || payload.recipientName);
  const recipientEmail = normalizeEmail(recipient.email || payload.recipientEmail);
  const senderEmail = normalizeEmail(payload.senderEmail || payload.buyerEmail || payload.customerEmail);

  if (!amount) throw new Error('Voucher amount is required');
  if (!recipientName) throw new Error('Recipient name is required');
  if (!recipientEmail) throw new Error('Recipient email is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) throw new Error('Recipient email is invalid');
  if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) throw new Error('Buyer email is required');

  return {
    amount,
    design: cleanText(payload.design, 'Classic Red'),
    validUntil: cleanText(payload.validUntil, 'One year from purchase'),
    recipientName,
    recipientEmail,
    senderEmail,
    message: cleanText(recipient.message || payload.message),
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

const buildEmailHtml = ({ title, lead, voucher, includeMessage = false }) => `
  <div style="font-family:Arial,sans-serif;background:#050505;color:#f7f2ea;padding:28px;">
    <h1 style="margin:0 0 12px;color:#fff;">${escapeHtml(title)}</h1>
    <p style="color:#ff1f3d;font-size:24px;font-weight:800;">${escapeHtml(money(voucher.amount))}</p>
    <p>${escapeHtml(lead)}</p>
    ${includeMessage && voucher.message ? `<p style="padding:14px 0;border-top:1px solid rgba(255,255,255,.16);border-bottom:1px solid rgba(255,255,255,.16);">${escapeHtml(voucher.message)}</p>` : ''}
    <p><strong>Voucher code:</strong> ${escapeHtml(voucher.voucherCode)}</p>
    <p><strong>Recipient:</strong> ${escapeHtml(voucher.recipientName)}</p>
    <p style="color:#aaa;">Your PDF voucher is attached.</p>
  </div>
`;

const sendVoucherPurchaseEmails = async ({ voucher, pdfBuffer, pdfPath }) => {
  const transporter = createTransport();
  const from = process.env.VOUCHER_FROM_EMAIL || process.env.SMTP_FROM || `Astravia <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;
  const attachment = {
    filename: `Astravia-${voucher.voucherCode}.pdf`,
    contentType: 'application/pdf',
    ...(pdfPath ? { path: pdfPath } : { content: pdfBuffer }),
  };

  const buyerResult = await transporter.sendMail({
    from,
    to: voucher.senderEmail,
    subject: 'Your Astravia Gift Voucher',
    text: [
      'Thank you for purchasing an Astravia gift voucher.',
      `Value: ${money(voucher.amount)}`,
      `Code: ${voucher.voucherCode}`,
      `Recipient: ${voucher.recipientName}`,
      '',
      'Your PDF voucher is attached.',
    ].join('\n'),
    html: buildEmailHtml({
      title: 'Your Astravia Gift Voucher',
      lead: 'Thank you for purchasing an Astravia gift voucher.',
      voucher,
    }),
    attachments: [attachment],
  });

  const recipientResult = await transporter.sendMail({
    from,
    to: voucher.recipientEmail,
    subject: "You've Received an Astravia Gift Voucher",
    text: [
      `Hi ${voucher.recipientName},`,
      '',
      'You have received an Astravia gift voucher.',
      voucher.message ? `Message: ${voucher.message}` : '',
      `Value: ${money(voucher.amount)}`,
      `Code: ${voucher.voucherCode}`,
      '',
      'Your PDF voucher is attached.',
    ].filter(Boolean).join('\n'),
    html: buildEmailHtml({
      title: "You've Received an Astravia Gift Voucher",
      lead: `Hi ${voucher.recipientName}, you have received an Astravia gift voucher.`,
      voucher,
      includeMessage: true,
    }),
    attachments: [attachment],
  });

  return {
    buyer: { accepted: buyerResult.accepted || [], messageId: buyerResult.messageId },
    recipient: { accepted: recipientResult.accepted || [], messageId: recipientResult.messageId },
  };
};

const orderVoucherIntent = (order = {}) => {
  const address = order.address || {};
  const direct = address.giftVoucher || address.voucher || order.giftVoucher || order.voucher;
  if (direct) return direct;
  const items = Array.isArray(order.items) ? order.items : [];
  const voucherItem = items.find((item) => String(item.product || item.productId || '').startsWith('gift-voucher'));
  if (!voucherItem) return null;
  return {
    amount: voucherItem.price,
    design: String(voucherItem.name || 'Astravia Gift Voucher').replace(/\s*Gift Voucher$/i, '') || 'Classic Red',
    recipient: voucherItem.recipient || address.recipient || {},
    senderEmail: order.customerEmail || order.customer?.email || order.user?.email,
  };
};

const codeExists = async (code) => {
  if (global.useMemoryStore) {
    return (store.giftVouchers || []).some((voucher) => voucher.voucherCode === code);
  }
  const rows = await prisma.$queryRaw`SELECT "id" FROM "GiftVoucher" WHERE "voucherCode" = ${code} LIMIT 1`;
  return rows.length > 0;
};

const generateUniqueVoucherCode = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = `ASTRAVIA-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    if (!(await codeExists(code))) return code;
  }
  return `ASTRAVIA-${Date.now().toString(36).toUpperCase()}`;
};

const toPublicVoucher = (voucher) => {
  if (!voucher) return null;
  return {
    id: voucher.id || voucher._id,
    _id: voucher.id || voucher._id,
    voucherCode: voucher.voucherCode,
    amount: Number(voucher.amount || 0),
    recipientName: voucher.recipientName,
    recipientEmail: voucher.recipientEmail,
    senderEmail: voucher.senderEmail,
    message: voucher.message || '',
    status: voucher.status || 'ACTIVE',
    pdfUrl: voucher.pdfUrl || '',
    purchasedAt: voucher.purchasedAt || voucher.createdAt,
    redeemedAt: voucher.redeemedAt || null,
    orderId: voucher.orderId || '',
  };
};

const findVoucherByOrderId = async (orderId) => {
  if (!orderId) return null;
  if (global.useMemoryStore) {
    return toPublicVoucher((store.giftVouchers || []).find((voucher) => String(voucher.orderId || '') === String(orderId)));
  }
  const rows = await prisma.$queryRaw`SELECT * FROM "GiftVoucher" WHERE "orderId" = ${orderId} LIMIT 1`;
  return toPublicVoucher(rows[0]);
};

const findActiveVoucher = async ({ id, voucherCode }) => {
  if (global.useMemoryStore) {
    const voucher = (store.giftVouchers || []).find((entry) => (
      (id && String(entry._id || entry.id) === String(id)) ||
      (voucherCode && entry.voucherCode === voucherCode)
    ));
    return voucher?.status === 'ACTIVE' ? toPublicVoucher(voucher) : null;
  }
  if (id) {
    const rows = await prisma.$queryRaw`SELECT * FROM "GiftVoucher" WHERE "id" = ${id} AND "status" = 'ACTIVE' LIMIT 1`;
    return toPublicVoucher(rows[0]);
  }
  if (voucherCode) {
    const rows = await prisma.$queryRaw`SELECT * FROM "GiftVoucher" WHERE "voucherCode" = ${voucherCode} AND "status" = 'ACTIVE' LIMIT 1`;
    return toPublicVoucher(rows[0]);
  }
  return null;
};

const getAllGiftVoucherSales = async () => {
  if (global.useMemoryStore) {
    return (store.giftVouchers || []).map(toPublicVoucher);
  }
  try {
    const rows = await prisma.$queryRaw`SELECT * FROM "GiftVoucher" ORDER BY "purchasedAt" DESC`;
    return rows.map(toPublicVoucher);
  } catch (error) {
    console.error({ endpoint: 'GiftVoucher sales query', table: 'GiftVoucher', error: error.message });
    return [];
  }
};

const getGiftVoucherSalesSummary = async () => {
  const vouchers = await getAllGiftVoucherSales();
  const totalAmount = vouchers.reduce((sum, voucher) => sum + Number(voucher.amount || 0), 0);
  return {
    totalAmount,
    totalSales: vouchers.length,
    activeCount: vouchers.filter((voucher) => voucher.status === 'ACTIVE').length,
    redeemedCount: vouchers.filter((voucher) => voucher.status === 'REDEEMED' || voucher.redeemedAt).length,
    vouchers,
  };
};

const insertFinanceTransaction = async ({ amount, reference }) => {
  const transactionId = `FIN-GV-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const now = new Date();
  if (global.useMemoryStore) {
    store.financeTransactions = store.financeTransactions || [];
    const transaction = {
      _id: createId(),
      transactionId,
      category: 'Gift Voucher',
      type: 'Income',
      amount: Number(amount || 0),
      status: 'Completed',
      reference,
      createdAt: now,
      updatedAt: now,
    };
    store.financeTransactions.unshift(transaction);
    return transaction;
  }

  const id = createId();
  await prisma.$executeRaw`
    INSERT INTO "FinanceTransaction" ("id", "transactionId", "category", "type", "amount", "status", "reference", "createdAt", "updatedAt")
    VALUES (${id}, ${transactionId}, 'Gift Voucher', 'Income', ${Number(amount || 0)}, 'Completed', ${reference || ''}, ${now}, ${now})
    ON CONFLICT ("transactionId") DO NOTHING
  `;
  return { id, transactionId, category: 'Gift Voucher', type: 'Income', amount: Number(amount || 0), status: 'Completed', reference };
};

const saveVoucherPdf = async (voucher) => {
  const payload = {
    amount: voucher.amount,
    code: voucher.voucherCode,
    design: voucher.design || 'Classic Red',
    validUntil: voucher.validUntil || 'One year from purchase',
    recipient: {
      name: voucher.recipientName,
      email: voucher.recipientEmail,
      message: voucher.message,
    },
  };
  const pdfBuffer = await renderVoucherPdf(payload);
  await fs.mkdir(voucherStorageDir, { recursive: true });
  const filename = `Astravia-${voucher.voucherCode}.pdf`;
  const pdfPath = path.join(voucherStorageDir, filename);
  await fs.writeFile(pdfPath, pdfBuffer);
  return { pdfBuffer, pdfPath, pdfUrl: publicVoucherPdfUrl(voucher.voucherCode) };
};

const createGiftVoucherRecord = async ({ voucher, orderId }) => {
  const now = new Date();
  if (global.useMemoryStore) {
    store.giftVouchers = store.giftVouchers || [];
    const existing = store.giftVouchers.find((entry) => String(entry.orderId || '') === String(orderId));
    if (existing) return toPublicVoucher(existing);
    const record = {
      _id: createId(),
      ...voucher,
      status: 'ACTIVE',
      orderId,
      purchasedAt: now,
      redeemedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    store.giftVouchers.unshift(record);
    return toPublicVoucher(record);
  }

  const id = createId();
  await prisma.$executeRaw`
    INSERT INTO "GiftVoucher" (
      "id", "voucherCode", "amount", "recipientName", "recipientEmail", "senderEmail", "message", "status", "pdfUrl", "purchasedAt", "redeemedAt", "orderId", "createdAt", "updatedAt"
    )
    VALUES (
      ${id}, ${voucher.voucherCode}, ${Number(voucher.amount || 0)}, ${voucher.recipientName}, ${voucher.recipientEmail}, ${voucher.senderEmail}, ${voucher.message || ''}, 'ACTIVE', ${voucher.pdfUrl || ''}, ${now}, NULL, ${orderId || null}, ${now}, ${now}
    )
    ON CONFLICT ("orderId") DO NOTHING
  `;
  return findVoucherByOrderId(orderId);
};

const fulfillGiftVoucherForOrder = async (orderInput) => {
  let order = orderInput;
  if (!order || typeof orderInput === 'string') {
    if (global.useMemoryStore) {
      order = store.orders.find((entry) => String(entry._id || entry.id || entry.orderId) === String(orderInput));
    } else {
      order = await prisma.order.findFirst({
        where: { OR: [{ id: String(orderInput) }, { orderId: String(orderInput) }] },
        include: { customer: true, user: { select: { id: true, name: true, email: true, customerId: true } } },
      });
    }
  }

  if (!order) throw new Error('Voucher order not found');
  const orderKey = order.id || order._id || order.orderId;
  const existing = await findVoucherByOrderId(orderKey);
  if (existing?.status === 'ACTIVE') return existing;

  const intent = orderVoucherIntent(order);
  if (!intent) return null;

  const normalized = normalizeVoucherIntent({
    ...intent,
    senderEmail: intent.senderEmail || order.customerEmail || order.customer?.email || order.user?.email,
  });
  const voucherCode = await generateUniqueVoucherCode();
  const draftVoucher = {
    ...normalized,
    voucherCode,
    status: 'ACTIVE',
    orderId: orderKey,
  };
  const { pdfBuffer, pdfPath, pdfUrl } = await saveVoucherPdf(draftVoucher);
  const voucher = await createGiftVoucherRecord({ voucher: { ...draftVoucher, pdfUrl }, orderId: orderKey });
  await insertFinanceTransaction({ amount: voucher.amount, reference: voucher.voucherCode });
  await sendVoucherPurchaseEmails({ voucher, pdfBuffer, pdfPath });
  return voucher;
};

const getVoucherPdf = async (voucher) => {
  if (!voucher || voucher.status !== 'ACTIVE') throw new Error(paymentRequiredMessage);
  const localPath = voucher.pdfUrl
    ? path.join(__dirname, '..', voucher.pdfUrl.replace(/^\//, '').replace(/\//g, path.sep))
    : path.join(voucherStorageDir, `Astravia-${voucher.voucherCode}.pdf`);
  try {
    return await fs.readFile(localPath);
  } catch {
    const { pdfBuffer } = await saveVoucherPdf({
      ...voucher,
      design: 'Classic Red',
      validUntil: 'One year from purchase',
    });
    return pdfBuffer;
  }
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
  paymentRequiredMessage,
  normalizeVoucher,
  normalizeVoucherIntent,
  renderVoucherPdf,
  sendVoucherEmail,
  sendVoucherPurchaseEmails,
  fulfillGiftVoucherForOrder,
  findActiveVoucher,
  findVoucherByOrderId,
  getAllGiftVoucherSales,
  getGiftVoucherSalesSummary,
  getVoucherPdf,
};
