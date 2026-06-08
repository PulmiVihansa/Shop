const prisma = require('../config/prisma');
const fs = require('fs');
const path = require('path');
const { store, createId } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');
const { createTransactionAndInvoice } = require('./orderDocumentService');
const { invoiceStorageDir, saveInvoicePdf } = require('./invoicePdfService');
const { sendInvoiceEmail } = require('./invoiceEmailService');
const { orderItemDiscountTotal } = require('./pricingService');

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const invoiceYearPrefix = () => `INV-${new Date().getFullYear()}`;

const nextMemoryInvoiceId = () => {
  const prefix = invoiceYearPrefix();
  const max = (store.invoices || []).reduce((highest, invoice) => {
    const match = String(invoice.invoiceId || '').match(/^INV-\d{4}-(\d+)$/);
    const parsed = match ? Number(match[1]) : 0;
    return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
  }, 1000);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
};

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

const addDays = (value, days) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const normalizeProducts = (order = {}, invoice = {}) => {
  const items = Array.isArray(order.items) && order.items.length
    ? order.items
    : Array.isArray(invoice.products) && invoice.products.length
      ? invoice.products
      : [{ name: order.productName || 'Product', quantity: order.quantity || 1, price: order.price || invoice.subtotal }];

  return items.map((item, index) => ({
    id: item.id || item.product || `${order.id || order._id || invoice.id || invoice._id || 'item'}-${index}`,
    product: item.product || item.productId || '',
    name: item.name || order.productName || 'Product',
    quantity: toNumber(item.quantity, 1),
    price: toNumber(item.price, 0),
    originalPrice: toNumber(item.originalPrice, toNumber(item.price, 0)),
    saleDiscount: toNumber(item.saleDiscount ?? item.discount, 0),
    isSale: Boolean(item.isSale),
    saleCampaignId: item.saleCampaignId || '',
    color: item.color || '',
    category: item.category || '',
    size: item.size || order.size || 'One Size',
    image: item.image || item.thumbnail || '',
  }));
};

const formatInvoice = (invoice) => {
  if (!invoice) return invoice;
  const order = invoice.order || {};
  const transaction = invoice.transaction || {};
  const customer = invoice.customer || {};
  const products = normalizeProducts(order, invoice);
  const subtotal = toNumber(invoice.subtotal, products.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const discount = toNumber(invoice.discount, 0);
  const shipping = toNumber(invoice.shipping, 0);
  const tax = toNumber(invoice.tax, 0);
  const grandTotal = toNumber(invoice.grandTotal ?? invoice.amount, subtotal + shipping + tax - discount);
  const customerAddress = invoice.customerAddress || order.address || {};

  return {
    ...withId(invoice),
    invoiceId: invoice.invoiceId,
    invoiceNumber: invoice.invoiceId,
    orderId: order.orderId || invoice.orderReference || invoice.orderId,
    orderPk: order.id || invoice.orderId,
    transactionId: transaction.transactionId || invoice.transactionReference || invoice.transactionId,
    transactionPk: transaction.id || invoice.transactionId,
    customerId: customer.customerId || invoice.customerId,
    customer: invoice.customerName || customer.name || invoice.customer || 'Customer',
    customerName: invoice.customerName || customer.name || invoice.customer || 'Customer',
    email: invoice.customerEmail || customer.email || invoice.email || '',
    customerEmail: invoice.customerEmail || customer.email || invoice.email || '',
    phone: invoice.customerPhone || customer.phone || invoice.phone || '',
    customerPhone: invoice.customerPhone || customer.phone || invoice.phone || '',
    customerAddress,
    customerAddressText: normalizeAddress(customerAddress),
    amount: grandTotal,
    subtotal,
    discount,
    shipping,
    tax,
    grandTotal,
    status: invoice.status || 'Paid',
    paymentMethod: transaction.paymentMethod || invoice.paymentMethod || '',
    paymentStatus: transaction.paymentStatus || invoice.paymentStatus || String(invoice.status || 'Paid').toUpperCase(),
    pdfUrl: invoice.pdfUrl || '',
    emailSent: Boolean(invoice.emailSent),
    issueDate: invoice.createdAt,
    dueDate: invoice.dueDate || addDays(invoice.createdAt, 7),
    date: invoice.createdAt,
    products,
  };
};

const buildSummary = (invoices) => {
  const paid = invoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'paid');
  const pending = invoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'pending');
  const refunded = invoices.filter((invoice) => String(invoice.status || '').toLowerCase() === 'refunded');
  const revenue = paid.reduce((sum, invoice) => sum + toNumber(invoice.grandTotal ?? invoice.amount), 0);

  return [
    { label: 'Total Invoices', value: invoices.length, trend: 'up', note: 'All generated invoices' },
    { label: 'Paid Invoices', value: paid.length, trend: 'up', note: 'Payment received' },
    { label: 'Pending Invoices', value: pending.length, trend: pending.length ? 'down' : 'up', note: 'Awaiting payment' },
    { label: 'Refunded Invoices', value: refunded.length, trend: 'down', note: 'Returned payments' },
    { label: 'Total Invoice Revenue', value: revenue, trend: 'up', note: 'Paid invoice value' },
  ];
};

const filterInvoices = (invoices, query = {}) => {
  const search = String(query.search || '').trim().toLowerCase();
  const status = String(query.status || 'all').toLowerCase();
  const sort = String(query.sort || 'desc').toLowerCase();

  return invoices
    .filter((invoice) => {
      const matchesSearch = !search || [
        invoice.invoiceId,
        invoice.orderId,
        invoice.transactionId,
        invoice.customer,
        invoice.email,
      ].some((value) => String(value || '').toLowerCase().includes(search));
      const matchesStatus = status === 'all' || String(invoice.status || '').toLowerCase() === status;
      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      const leftDate = new Date(left.date || left.createdAt || 0).getTime();
      const rightDate = new Date(right.date || right.createdAt || 0).getTime();
      return sort === 'asc' ? leftDate - rightDate : rightDate - leftDate;
    });
};

const paginateInvoices = (invoices, query = {}) => {
  const page = Math.max(1, Math.trunc(toNumber(query.page, 1)));
  const limit = Math.min(50, Math.max(1, Math.trunc(toNumber(query.limit, 10))));
  const total = invoices.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    invoices: invoices.slice(start, start + limit),
    pagination: { page, limit, total, pages },
  };
};

const getInvoiceDashboard = async (query = {}) => {
  if (global.useMemoryStore) {
    const formatted = (store.invoices || []).map(formatInvoice);
    const filtered = filterInvoices(formatted, query);
    const paged = paginateInvoices(filtered, query);
    return { summary: buildSummary(formatted), ...paged };
  }

  const invoices = await prisma.invoice.findMany({
    include: {
      customer: true,
      order: true,
      transaction: true
    },
    orderBy: { createdAt: 'desc' }
  });
  const formatted = invoices.map(formatInvoice);
  const filtered = filterInvoices(formatted, query);
  const paged = paginateInvoices(filtered, query);
  return { summary: buildSummary(formatted), ...paged };
};

const getInvoiceById = async (id) => {
  if (global.useMemoryStore) {
    return (store.invoices || []).map(formatInvoice).find((invoice) => invoice.id === id || invoice._id === id || invoice.invoiceId === id);
  }

  const invoice = await prisma.invoice.findFirst({
    where: { OR: [{ id }, { invoiceId: id }] },
    include: {
      customer: true,
      order: true,
      transaction: true
    }
  });
  return formatInvoice(invoice);
};

const invoicePdfFileName = (invoice) => `${String(invoice?.invoiceId || invoice?.id || '').replace(/[^a-z0-9-]/gi, '_')}.pdf`;

const invoicePdfUrlToPath = (pdfUrl = '') => {
  const normalized = String(pdfUrl || '').replace(/\\/g, '/');
  const uploadsPrefix = '/uploads/invoices/';
  const storagePrefix = '/storage/invoices/';

  if (normalized.startsWith(uploadsPrefix)) {
    return path.join(__dirname, '..', 'uploads', 'invoices', path.basename(normalized));
  }

  if (normalized.startsWith(storagePrefix)) {
    return path.join(__dirname, '..', 'storage', 'invoices', path.basename(normalized));
  }

  return '';
};

const getInvoicePdfPath = (invoice) => {
  const storedPath = invoicePdfUrlToPath(invoice?.pdfUrl);
  if (storedPath && fs.existsSync(storedPath)) {
    return { filePath: storedPath, pdfUrl: invoice.pdfUrl };
  }

  const uploadsPath = path.join(invoiceStorageDir, invoicePdfFileName(invoice));
  if (fs.existsSync(uploadsPath)) {
    return { filePath: uploadsPath, pdfUrl: `/uploads/invoices/${path.basename(uploadsPath)}` };
  }

  return null;
};

const persistPdfUrl = async (invoice, pdfUrl) => {
  if (global.useMemoryStore) {
    const record = store.invoices.find((entry) => entry._id === invoice.id || entry._id === invoice._id || entry.invoiceId === invoice.invoiceId);
    if (record) record.pdfUrl = pdfUrl;
    return record ? formatInvoice(record) : invoice;
  }

  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl },
    include: { customer: true, order: true, transaction: true }
  });
  return formatInvoice(updated);
};

const ensureInvoicePdf = async (id, options = {}) => {
  const invoice = await getInvoiceById(id);
  if (!invoice) return null;

  const existing = getInvoicePdfPath(invoice);
  if (existing && !options.force) {
    const updated = invoice.pdfUrl === existing.pdfUrl ? invoice : await persistPdfUrl(invoice, existing.pdfUrl);
    return { invoice: updated, filePath: existing.filePath, pdfUrl: existing.pdfUrl };
  }

  const saved = await saveInvoicePdf(invoice);
  const updated = await persistPdfUrl(invoice, saved.pdfUrl);
  return { invoice: updated, filePath: saved.filePath, pdfUrl: saved.pdfUrl };
};

const getExistingInvoicePdf = async (id) => {
  const invoice = await getInvoiceById(id);
  if (!invoice) return null;

  const existing = getInvoicePdfPath(invoice);
  if (!existing) return { invoice, missing: true };

  const updated = invoice.pdfUrl === existing.pdfUrl ? invoice : await persistPdfUrl(invoice, existing.pdfUrl);
  return { invoice: updated, filePath: existing.filePath, pdfUrl: existing.pdfUrl };
};

const markInvoiceEmailSent = async (id, emailSent = true) => {
  if (global.useMemoryStore) {
    const record = store.invoices.find((entry) => entry._id === id || entry.id === id || entry.invoiceId === id);
    if (record) record.emailSent = emailSent;
    return record ? formatInvoice(record) : null;
  }

  const updated = await prisma.invoice.update({
    where: { id },
    data: { emailSent },
    include: { customer: true, order: true, transaction: true }
  });
  return formatInvoice(updated);
};

const emailInvoice = async (id, options = {}) => {
  const pdf = await ensureInvoicePdf(id);
  if (!pdf) return null;
  const result = await sendInvoiceEmail({
    invoice: pdf.invoice,
    pdfPath: pdf.filePath,
    to: options.to,
    subject: options.subject,
    message: options.message,
  });
  const updated = await markInvoiceEmailSent(pdf.invoice.id || pdf.invoice._id || pdf.invoice.invoiceId, true);
  return { invoice: updated || pdf.invoice, email: result };
};

const generateInvoiceForOrder = async (orderId, options = {}) => {
  if (global.useMemoryStore) {
    const order = store.orders.find((entry) => entry._id === orderId || entry.id === orderId || entry.orderId === orderId);
    if (!order) return null;
    const existing = store.invoices.find((entry) => entry.orderId === order._id || entry.orderReference === order.orderId);
    const invoice = existing || {
      _id: createId(),
      invoiceId: nextMemoryInvoiceId(),
      orderId: order._id,
      orderReference: order.orderId,
      transactionId: order.transactionId || `TXN-${1001 + (store.transactions?.length || 0)}`,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.phone,
      customerAddress: order.address || {},
      subtotal: order.price,
      shipping: order.shippingCost,
      discount: orderItemDiscountTotal(order.items),
      tax: 0,
      grandTotal: order.totalAmount,
      status: options.status || 'Paid',
      products: order.items || [],
      pdfUrl: '',
      emailSent: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (!existing) store.invoices.unshift(invoice);
    const pdf = await ensureInvoicePdf(invoice.invoiceId);
    if (options.sendEmail) await emailInvoice(invoice.invoiceId);
    return pdf?.invoice || formatInvoice(invoice);
  }

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: orderId }, { orderId }] },
    include: {
      customer: true,
      transaction: true,
      transactionRecord: true,
      invoice: true,
    }
  });
  if (!order) return null;

  const transaction = order.transaction || order.transactionRecord;
  const paymentStatus = String(options.paymentStatus || transaction?.paymentStatus || 'PAID').toUpperCase();
  if (!['PAID', 'REFUNDED'].includes(paymentStatus)) {
    throw new Error('Invoices can only be generated for paid or refunded orders');
  }

  const invoiceRecord = await prisma.$transaction(async (tx) => {
    await createTransactionAndInvoice(tx, order, {
      paymentMethod: options.paymentMethod || transaction?.paymentMethod || 'ONLINE',
      paymentStatus,
      amount: order.totalAmount,
      subtotal: order.price,
      shipping: order.shippingCost,
      discount: options.discount ?? orderItemDiscountTotal(order.items),
      tax: options.tax || 0,
      grandTotal: order.totalAmount,
      customer: order.customer,
      customerAddress: order.address,
    });

    return tx.invoice.findUnique({
      where: { orderId: order.id },
      include: { customer: true, order: true, transaction: true }
    });
  });

  const formatted = formatInvoice(invoiceRecord);
  const saved = await saveInvoicePdf(formatted);
  const updated = await persistPdfUrl(formatted, saved.pdfUrl);
  if (options.sendEmail) await emailInvoice(updated.id);
  return updated;
};

module.exports = {
  buildSummary,
  emailInvoice,
  ensureInvoicePdf,
  formatInvoice,
  generateInvoiceForOrder,
  getExistingInvoicePdf,
  getInvoiceById,
  getInvoiceDashboard,
};
