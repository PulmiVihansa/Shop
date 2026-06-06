const parsePublicId = (value, prefix) => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(new RegExp(`^${prefix}-(\\d+)$`));
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const getNextPublicId = async (db, modelName, fieldName, prefix, start = 1001) => {
  const records = await db[modelName].findMany({
    where: { [fieldName]: { startsWith: `${prefix}-` } },
    select: { [fieldName]: true }
  });
  const max = records.reduce((highest, record) => {
    const parsed = parsePublicId(record[fieldName], prefix);
    return parsed && parsed > highest ? parsed : highest;
  }, start - 1);
  return `${prefix}-${max + 1}`;
};

const getNextInvoiceId = async (db, start = 1001) => {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}`;
  const records = await db.invoice.findMany({
    where: { invoiceId: { startsWith: `${prefix}-` } },
    select: { invoiceId: true }
  });
  const max = records.reduce((highest, record) => {
    const match = String(record.invoiceId || '').match(/^INV-\d{4}-(\d+)$/);
    const parsed = match ? Number(match[1]) : 0;
    return Number.isFinite(parsed) && parsed > highest ? parsed : highest;
  }, start - 1);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
};

const randomTransactionId = () => `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

const getNextTransactionId = async (db) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const transactionId = randomTransactionId();
    const existing = await db.transaction.findUnique({ where: { transactionId } });
    if (!existing) return transactionId;
  }

  return getNextPublicId(db, 'transaction', 'transactionId', 'TXN', 100001);
};

const ensureCustomerForOrder = async (db, user, details = {}) => {
  const userId = user?._id || user?.id || null;
  const email = String(details.email || user?.email || '').toLowerCase();
  const name = details.name || user?.name || 'Customer';
  const phone = details.phone || '';
  const externalCustomerId =
    user?.customerId ||
    details.customerId ||
    (await getNextPublicId(db, 'customer', 'customerId', 'CUS', 1001));

  const existing = await db.customer.findFirst({
    where: {
      OR: [
        userId ? { userId } : undefined,
        email ? { email } : undefined,
        externalCustomerId ? { customerId: externalCustomerId } : undefined
      ].filter(Boolean)
    }
  });

  if (existing) {
    return db.customer.update({
      where: { id: existing.id },
      data: {
        userId: existing.userId || userId || undefined,
        name: name || existing.name,
        email: email || existing.email,
        phone: phone || existing.phone
      }
    });
  }

  return db.customer.create({
    data: {
      customerId: externalCustomerId,
      userId,
      name,
      email,
      phone
    }
  });
};

const invoiceStatusForPayment = (paymentStatus) => {
  const normalized = String(paymentStatus || '').toUpperCase();
  if (normalized === 'REFUNDED') return 'Refunded';
  if (normalized === 'PAID') return 'Paid';
  return 'Pending';
};

const createTransactionAndInvoice = async (db, order, details = {}) => {
  const paymentStatus = String(details.paymentStatus || 'PAID').toUpperCase();
  const paymentMethod = String(details.paymentMethod || 'ONLINE').toUpperCase();

  const existingTransaction = await db.transaction.findUnique({
    where: { orderId: order.id },
    include: { invoice: true }
  });

  const transactionRecord = existingTransaction
    ? await db.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          amount: Number(details.amount ?? order.totalAmount ?? 0),
          paymentMethod,
          paymentStatus
        }
      })
    : await db.transaction.create({
        data: {
          transactionId: details.transactionId || await getNextTransactionId(db),
          orderId: order.id,
          customerId: order.customerId,
          amount: Number(details.amount ?? order.totalAmount ?? 0),
          paymentMethod,
          paymentStatus
        }
      });

  await db.order.update({
    where: { id: order.id },
    data: { transactionId: transactionRecord.id }
  });

  let invoice = existingTransaction?.invoice || null;
  if (['PAID', 'REFUNDED'].includes(paymentStatus)) {
    const subtotal = Number(details.subtotal ?? order.price ?? 0);
    const shipping = Number(details.shipping ?? order.shippingCost ?? 0);
    const discount = Number(details.discount ?? 0);
    const tax = Number(details.tax ?? 0);
    const grandTotal = Number(details.grandTotal ?? order.totalAmount ?? subtotal + shipping + tax - discount);
    const customer = details.customer || order.customer || await db.customer.findUnique({ where: { id: order.customerId } });
    const address = details.customerAddress || order.address || {};

    invoice = await db.invoice.upsert({
      where: { orderId: order.id },
      update: {
        transactionId: transactionRecord.id,
        customerId: order.customerId,
        customerName: customer?.name || details.customerName || '',
        customerEmail: customer?.email || details.customerEmail || '',
        customerPhone: customer?.phone || details.customerPhone || '',
        customerAddress: address,
        subtotal,
        shipping,
        discount,
        tax,
        grandTotal,
        status: invoiceStatusForPayment(paymentStatus)
      },
      create: {
        invoiceId: await getNextInvoiceId(db, 1001),
        orderId: order.id,
        transactionId: transactionRecord.id,
        customerId: order.customerId,
        customerName: customer?.name || details.customerName || '',
        customerEmail: customer?.email || details.customerEmail || '',
        customerPhone: customer?.phone || details.customerPhone || '',
        customerAddress: address,
        subtotal,
        shipping,
        discount,
        tax,
        grandTotal,
        status: invoiceStatusForPayment(paymentStatus)
      }
    });
  }

  return { transaction: transactionRecord, invoice };
};

module.exports = {
  getNextPublicId,
  getNextTransactionId,
  getNextInvoiceId,
  ensureCustomerForOrder,
  createTransactionAndInvoice
};
