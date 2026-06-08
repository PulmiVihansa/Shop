const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

const invoiceStorageDir = path.join(__dirname, '..', 'uploads', 'invoices');
const logoPath = path.join(__dirname, '..', '..', 'frontend', 'src', 'assets', 'Name 2.png');
const templatePath = path.join(__dirname, '..', 'templates', 'invoiceTemplate.html');
const templateCssPath = path.join(__dirname, '..', 'templates', 'invoiceTemplate.css');

const logoDataUri = fsSync.existsSync(logoPath)
  ? `data:image/png;base64,${fsSync.readFileSync(logoPath).toString('base64')}`
  : '';

const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const dateText = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const addDays = (value, days) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const dueDateText = (invoice) => dateText(invoice.dueDate || addDays(invoice.issueDate || invoice.createdAt, 7));

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const normalizeAddress = (address = {}) => {
  if (typeof address === 'string') return address;
  return [
    address.line1,
    address.line2,
    address.city,
    address.postalCode,
    address.country,
  ].filter(Boolean).join(', ');
};

const addressLines = (address = {}) => {
  if (typeof address === 'string') return address.split(',').map((line) => line.trim()).filter(Boolean);
  return [
    address.line1,
    address.line2,
    [address.city, address.postalCode].filter(Boolean).join(' '),
    address.country,
  ].filter(Boolean);
};

const productImage = (item, index) => {
  const image = item.image || item.thumbnail || (Array.isArray(item.images) ? item.images[0] : '');
  if (image) return `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name || 'Product')}" />`;

  const tones = [
    ['#1b1b1b', '#f7f0ea'],
    ['#efe6df', '#9f8170'],
    ['#b98145', '#f4e3c7'],
  ][index % 3];
  return `<span class="product-thumb" style="--thumb-a:${tones[0]};--thumb-b:${tones[1]};"></span>`;
};

const productRows = (invoice) => (invoice.products || []).map((item, index) => {
  const quantity = Number(item.quantity || 1);
  const unitPrice = Number(item.price || 0);
  const originalPrice = Number(item.originalPrice || unitPrice);
  const saleDiscount = Number(item.saleDiscount || item.discount || 0);
  const isSale = Boolean(item.isSale && saleDiscount > 0 && originalPrice > unitPrice);
  const meta = [item.color, item.category, item.size].filter(Boolean).join(' / ');
  const unitPriceHtml = isSale
    ? `<div class="invoice-price"><strong>${money(unitPrice)}</strong><del>${money(originalPrice)}</del><small>- ${money(saleDiscount)} sale discount</small></div>`
    : money(unitPrice);
  return `
            <tr>
              <td>
                <div class="product-cell">
                    ${productImage(item, index)}
                  <div>
                    <strong>${escapeHtml(item.name || 'Product')}</strong>
                    ${meta ? `<small>${escapeHtml(meta)}</small>` : ''}
                  </div>
                </div>
              </td>
              <td>${quantity}</td>
              <td>${unitPriceHtml}</td>
              <td>${money(unitPrice * quantity)}</td>
            </tr>`;
}).join('');

const fillTemplate = (template, values) => Object.entries(values).reduce(
  (html, [key, value]) => html.replaceAll(`{{${key}}}`, String(value ?? '')),
  template,
);

const loadInvoiceTemplate = () => ({
  html: fsSync.readFileSync(templatePath, 'utf8'),
  css: fsSync.readFileSync(templateCssPath, 'utf8'),
});

const buildInvoiceHtml = (invoice) => {
  const template = loadInvoiceTemplate();
  const address = invoice.customerAddress || invoice.address || {};
  const status = String(invoice.paymentStatus || invoice.status || 'PAID').toUpperCase();
  const subtotal = Number(invoice.subtotal || 0);
  const discount = Number(invoice.discount || 0);
  const displaySubtotal = subtotal + discount;
  const shipping = Number(invoice.shipping || 0);
  const tax = Number(invoice.tax || 0);
  const grandTotal = Number(invoice.grandTotal || invoice.amount || subtotal + shipping + tax - discount);
  const products = Array.isArray(invoice.products) && invoice.products.length ? invoice.products : [];
  const itemDensity = products.length >= 7 ? 'density-compact' : products.length >= 4 ? 'density-medium' : 'density-normal';

  return fillTemplate(template.html, {
    CSS: template.css,
    ITEM_DENSITY: itemDensity,
    LOGO_SRC: logoDataUri,
    INVOICE_ID: escapeHtml(invoice.invoiceId || ''),
    ISSUE_DATE: dateText(invoice.issueDate || invoice.createdAt),
    DUE_DATE: dueDateText(invoice),
    PAYMENT_STATUS: escapeHtml(status),
    CUSTOMER_NAME: escapeHtml(invoice.customer || invoice.customerName || 'Customer'),
    CUSTOMER_EMAIL: escapeHtml(invoice.email || invoice.customerEmail || ''),
    CUSTOMER_PHONE: escapeHtml(invoice.phone || invoice.customerPhone || ''),
    CUSTOMER_ADDRESS: addressLines(address).map(escapeHtml).join('<br />') || 'Sri Lanka',
    ORDER_ID: escapeHtml(invoice.orderId || ''),
    TRANSACTION_ID: escapeHtml(invoice.transactionId || ''),
    PRODUCT_ROWS: productRows({ ...invoice, products }),
    SUBTOTAL: money(displaySubtotal),
    DISCOUNT_ROW: discount > 0 ? `<div class="total-row"><span>DISCOUNT</span><strong>${money(discount)}</strong></div>` : '',
    SHIPPING: money(shipping),
    TAX: money(tax),
    GRAND_TOTAL: money(grandTotal),
  });
};

const escapePdfText = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildFallbackPdf = (invoice) => {
  const lines = [
    'ASTRAVIA INVOICE',
    `Invoice ID: ${invoice.invoiceId}`,
    `Order Reference: ${invoice.orderId || ''}`,
    `Transaction Reference: ${invoice.transactionId || ''}`,
    `Customer: ${invoice.customer || invoice.customerName || 'Customer'}`,
    `Email: ${invoice.email || invoice.customerEmail || ''}`,
    `Grand Total: ${money(invoice.grandTotal || invoice.amount)}`,
  ];
  const content = ['BT', '/F1 12 Tf', '50 790 Td', ...lines.flatMap((line, index) => [
    index === 0 ? '' : '0 -22 Td',
    `(${escapePdfText(line)}) Tj`,
  ]).filter(Boolean), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
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

const renderInvoicePdf = async (invoice) => {
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
      await page.setContent(buildInvoiceHtml(invoice), { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      return await page.pdf({
        format: 'A4',
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
        printBackground: true,
        preferCSSPageSize: true,
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    return buildFallbackPdf(invoice);
  }
};

const saveInvoicePdf = async (invoice) => {
  await fs.mkdir(invoiceStorageDir, { recursive: true });
  const fileName = `${String(invoice.invoiceId || invoice.id).replace(/[^a-z0-9-]/gi, '_')}.pdf`;
  const filePath = path.join(invoiceStorageDir, fileName);
  const pdf = await renderInvoicePdf(invoice);
  await fs.writeFile(filePath, pdf);
  return {
    fileName,
    filePath,
    pdfUrl: `/uploads/invoices/${fileName}`,
  };
};

module.exports = {
  buildInvoiceHtml,
  invoiceStorageDir,
  money,
  normalizeAddress,
  renderInvoicePdf,
  saveInvoicePdf,
};
