const prisma = require('../config/prisma');
const { ensureCustomerIds } = require('../utils/customerId');
const {
  getNextPublicId,
  ensureCustomerForOrder,
  createTransactionAndInvoice
} = require('../services/orderDocumentService');

const randomToken = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const makeAddress = (name, phone, city) => ({
  fullName: name,
  line1: `${Math.floor(Math.random() * 140) + 10} Atelier Street`,
  line2: 'Suite 2',
  city,
  postalCode: '00100',
  country: 'Sri Lanka',
  phone
});

async function seedOrders() {
  await ensureCustomerIds(prisma);
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });

  if (!users.length) {
    throw new Error('No users found. Create at least one user before seeding orders.');
  }
  if (!products.length) {
    throw new Error('No products found. Create products before seeding orders.');
  }

  const now = new Date();
  const templates = [
    { status: 'pending', paymentStatus: 'PENDING', method: 'COD', city: 'Colombo', phone: '+94 77 111 2233', daysAgo: 1, qty: 1 },
    { status: 'processing', paymentStatus: 'PAID', method: 'ONLINE', city: 'Kandy', phone: '+94 76 444 1188', daysAgo: 3, qty: 2 },
    { status: 'shipped', paymentStatus: 'PAID', method: 'ONLINE', city: 'Galle', phone: '+94 71 888 6622', daysAgo: 6, qty: 1 },
    { status: 'delivered', paymentStatus: 'PAID', method: 'ONLINE', city: 'Jaffna', phone: '+94 75 234 1177', daysAgo: 10, qty: 3 },
    { status: 'cancelled', paymentStatus: 'REFUNDED', method: 'ONLINE', city: 'Negombo', phone: '+94 74 001 4567', daysAgo: 14, qty: 1 }
  ];

  for (let index = 0; index < templates.length; index += 1) {
    const template = templates[index];
    const user = users[index % users.length];
    const product = products[index % products.length];
    const orderDate = new Date(now.getTime() - template.daysAgo * 86400000);
    const size = product.sizes?.[index % Math.max(1, product.sizes.length)] || 'M';
    const price = Number(product.price || 0) * template.qty;
    const shippingCost = price > 25000 || price === 0 ? 0 : template.method === 'COD' ? 900 : 650;
    const totalAmount = price + shippingCost;
    const customer = await ensureCustomerForOrder(prisma, user, {
      name: user.name,
      email: user.email,
      phone: template.phone
    });

    const order = await prisma.order.create({
      data: {
        orderId: await getNextPublicId(prisma, 'order', 'orderId', 'ORD', 1001),
        userId: user.id,
        customerId: customer.id,
        address: makeAddress(user.name, template.phone, template.city),
        productName: product.name,
        size,
        quantity: template.qty,
        price,
        shippingCost,
        totalAmount,
        status: template.status,
        createdAt: orderDate,
        updatedAt: orderDate,
        items: [
          {
            product: product.id,
            name: product.name,
            size,
            quantity: template.qty,
            price: Number(product.price || 0),
          }
        ]
      }
    });

    if (['PAID', 'REFUNDED'].includes(template.paymentStatus)) {
      await createTransactionAndInvoice(prisma, order, {
        paymentMethod: template.method,
        paymentStatus: template.paymentStatus,
        amount: totalAmount,
        subtotal: price,
        shipping: shippingCost,
        grandTotal: totalAmount
      });
    }
  }
}

seedOrders()
  .then(async () => {
    console.log('Sample orders seeded successfully.');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Failed to seed orders:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
