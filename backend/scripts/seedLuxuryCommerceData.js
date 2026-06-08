const prisma = require('../config/prisma');

const now = new Date('2026-06-02T10:30:00.000Z');

const records = [
  {
    customerId: 'CUS-1048',
    name: 'Maya Perera',
    email: 'maya.perera@example.com',
    phone: '+94 77 214 5588',
    orderId: 'ORD-1048',
    transactionId: 'TXN-782451',
    invoiceId: 'INV-2026-1048',
    productName: 'Silk Wrap Maxi',
    collection: 'Women',
    size: 'M',
    quantity: 1,
    unitPrice: 485000,
    shipping: 0,
    paymentMethod: 'ONLINE',
    city: 'Colombo',
    line1: '42 Ward Place',
    postalCode: '00700',
    createdAt: new Date('2026-05-28T08:45:00.000Z')
  },
  {
    customerId: 'CUS-1050',
    name: 'Kavindu Jay',
    email: 'kavindu.jay@example.com',
    phone: '+94 71 883 6622',
    orderId: 'ORD-1050',
    transactionId: 'TXN-782453',
    invoiceId: 'INV-2026-1050',
    productName: 'Raffia Structured Tote',
    collection: 'Accessories',
    size: 'One Size',
    quantity: 1,
    unitPrice: 320000,
    shipping: 0,
    paymentMethod: 'ONLINE',
    city: 'Galle',
    line1: '9 Lighthouse Avenue',
    postalCode: '80000',
    createdAt: new Date('2026-06-01T14:05:00.000Z')
  }
];

const buildAddress = (record) => ({
  fullName: record.name,
  line1: record.line1,
  line2: '',
  city: record.city,
  postalCode: record.postalCode,
  country: 'Sri Lanka',
  phone: record.phone
});

const productImageData = (record) => {
  const palette = {
    'Silk Wrap Maxi': ['#111111', '#f1ece8'],
    'Raffia Structured Tote': ['#b67434', '#f2d4a4'],
  }[record.productName] || ['#111111', '#eeeeee'];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
      <rect width="160" height="160" fill="${palette[1]}"/>
      <rect x="36" y="26" width="88" height="108" rx="10" fill="${palette[0]}" opacity=".92"/>
      <path d="M55 34 C68 50 92 50 105 34" fill="none" stroke="#d00000" stroke-width="4"/>
      <text x="80" y="148" text-anchor="middle" font-family="Arial" font-size="13" fill="#111">Astravia</text>
    </svg>
  `.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const buildItems = (record) => ([
  {
    product: '',
    name: record.productName,
    collection: record.collection,
    sku: `AST-${record.orderId.replace('ORD-', '')}`,
    size: record.size,
    quantity: record.quantity,
    price: record.unitPrice,
    image: productImageData(record)
  }
]);

async function seedLuxuryCommerceData() {
  const created = await prisma.$transaction(async (tx) => {
    const result = [];
    const orderIds = records.map((record) => record.orderId);

    await tx.order.updateMany({
      where: { orderId: { in: orderIds } },
      data: {
        transactionId: null,
        updatedAt: now
      }
    });

    for (const record of records) {
      const subtotal = record.unitPrice * record.quantity;
      const grandTotal = subtotal + record.shipping;
      const address = buildAddress(record);
      const items = buildItems(record);

      const customer = await tx.customer.upsert({
        where: { customerId: record.customerId },
        update: {
          name: record.name,
          email: record.email,
          phone: record.phone
        },
        create: {
          customerId: record.customerId,
          name: record.name,
          email: record.email,
          phone: record.phone,
          createdAt: record.createdAt,
          updatedAt: now
        }
      });

      const order = await tx.order.upsert({
        where: { orderId: record.orderId },
        update: {
          customerId: customer.id,
          productName: record.productName,
          size: record.size,
          quantity: record.quantity,
          price: subtotal,
          shippingCost: record.shipping,
          totalAmount: grandTotal,
          status: 'delivered',
          address,
          items,
          updatedAt: now
        },
        create: {
          orderId: record.orderId,
          customerId: customer.id,
          productName: record.productName,
          size: record.size,
          quantity: record.quantity,
          price: subtotal,
          shippingCost: record.shipping,
          totalAmount: grandTotal,
          status: 'delivered',
          address,
          items,
          createdAt: record.createdAt,
          updatedAt: now
        }
      });

      const existingTransaction = await tx.transaction.findFirst({
        where: {
          OR: [
            { transactionId: record.transactionId },
            { orderId: order.id }
          ]
        }
      });

      const transaction = existingTransaction
        ? await tx.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            transactionId: record.transactionId,
            orderId: order.id,
            customerId: customer.id,
            amount: grandTotal,
            paymentMethod: record.paymentMethod,
            paymentStatus: 'PAID',
            updatedAt: now
          }
        })
        : await tx.transaction.create({
          data: {
            transactionId: record.transactionId,
            orderId: order.id,
            customerId: customer.id,
            amount: grandTotal,
            paymentMethod: record.paymentMethod,
            paymentStatus: 'PAID',
            createdAt: record.createdAt,
            updatedAt: now
          }
        });

      const linkedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          transactionId: transaction.id,
          updatedAt: now
        }
      });

      const existingInvoice = await tx.invoice.findFirst({
        where: {
          OR: [
            { invoiceId: record.invoiceId },
            { orderId: linkedOrder.id },
            { transactionId: transaction.id }
          ]
        }
      });

      const invoiceData = {
        invoiceId: record.invoiceId,
        orderId: linkedOrder.id,
        transactionId: transaction.id,
        customerId: customer.id,
        customerName: record.name,
        customerEmail: record.email,
        customerPhone: record.phone,
        customerAddress: address,
        subtotal,
        shipping: record.shipping,
        discount: 0,
        tax: 0,
        grandTotal,
        status: 'Paid',
        updatedAt: now
      };

      const invoice = existingInvoice
        ? await tx.invoice.update({
          where: { id: existingInvoice.id },
          data: invoiceData
        })
        : await tx.invoice.create({
          data: {
            ...invoiceData,
            createdAt: record.createdAt
          }
        });

      result.push({ customer, order: linkedOrder, transaction, invoice });
    }

    return result;
  });

  const verification = await prisma.order.findMany({
    where: { orderId: { in: records.map((record) => record.orderId) } },
    include: {
      customer: true,
      transactionRecord: true,
      transaction: true,
      invoice: {
        include: {
          transaction: true,
          customer: true
        }
      }
    },
    orderBy: { orderId: 'asc' }
  });

  const revenue = verification.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const relationshipChecks = verification.map((order) => ({
    orderId: order.orderId,
    customer: order.customer.name,
    transactionId: order.transactionRecord?.transactionId || order.transaction?.transactionId || null,
    invoiceId: order.invoice?.invoiceId || null,
    orderToTransaction: Boolean(order.transactionRecord && order.transactionId === order.transactionRecord.id),
    invoiceToOrder: Boolean(order.invoice && order.invoice.orderId === order.id),
    invoiceToTransaction: Boolean(order.invoice && order.transactionRecord && order.invoice.transactionId === order.transactionRecord.id),
    amount: order.totalAmount
  }));

  console.log(JSON.stringify({
    upserted: created.length,
    orders: verification.length,
    transactions: verification.filter((order) => order.transactionRecord).length,
    invoices: verification.filter((order) => order.invoice).length,
    deliveredOrders: verification.filter((order) => order.status === 'delivered').length,
    paidTransactions: verification.filter((order) => order.transactionRecord?.paymentStatus === 'PAID').length,
    paidInvoices: verification.filter((order) => order.invoice?.status === 'Paid').length,
    revenue,
    relationshipChecks
  }, null, 2));
}

seedLuxuryCommerceData()
  .catch((error) => {
    console.error('Failed to seed luxury commerce data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
