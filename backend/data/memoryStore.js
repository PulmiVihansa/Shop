const bcrypt = require('bcryptjs');

const store = {
  users: [],
  products: [],
  orders: [],
  expenses: [],
  bulkCustomers: [],
  settings: {
    whatsappNumber: '94770000000',
  },
  paymentSettings: {
    paymentProvider: 'PayHere',
    merchantId: '121XXXX',
    merchantSecret: 'dev-secret',
    currency: 'LKR',
    enableCOD: true,
    enableOnlinePayment: true,
    whatsappNumber: '94770000000',
    updatedAt: new Date(),
  },
  siteSettings: {
    storeName: 'ATELIER',
    logoUrl: '',
    whatsappNumber: '94770000000',
    currency: 'LKR',
    contactEmail: 'hello@atelier.lk',
    updatedAt: new Date(),
  },
  homepageContent: {
    heroTitle: 'Timeless\nElegance,\nRedefined',
    heroSubtitle: 'Discover our curated collection of contemporary pieces that blend minimalist design with artisanal craftsmanship.',
    heroImage: '',
    heroImageSecondary: '',
    buttonText: 'Explore Collection',
    buttonLink: '#collections',
    section2Title: 'Essential Pieces',
    section2Image: '',
    productOneImage: '',
    productTwoImage: '',
    productThreeImage: '',
    featuredCategories: ['New Arrivals', 'Men', 'Accessories'],
    updatedAt: new Date(),
  },
  banners: [],
  pageContents: [],
};

const createId = () => `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`.padEnd(24, '0').slice(0, 24);

const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@atelier.com';
  const password = process.env.ADMIN_PASSWORD || 'admin12345';
  const existing = store.users.find((user) => user.email === email);

  if (existing) return existing;

  const admin = {
    _id: createId(),
    name: process.env.ADMIN_NAME || 'ATELIER Admin',
    email,
    password: await bcrypt.hash(password, 10),
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.users.push(admin);
  return admin;
};

const seedProducts = () => {
  if (store.products.length) return;

  store.products.push(
    {
      _id: createId(),
      name: 'Draped Linen Coat',
      price: 490,
      description: 'A hand-cut linen coat for the SS26 edit.',
      category: 'women',
      images: [],
      sizes: ['XS', 'S', 'M', 'L'],
      stock: 12,
      sizeStock: { S: 15, M: 5, L: 0, XL: 2 },
      tags: ['new'],
      placements: ['women', 'new-arrivals'],
      badge: 'pnew',
      badgeText: 'New',
      bgClass: 'b1',
      swatches: ['#C8BAB0', '#A8B8A0', '#1A1A1A'],
      imageClass: 'linen',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: createId(),
      name: 'Linen Oxford Shirt',
      price: 210,
      description: 'A relaxed linen shirt with hand-finished details.',
      category: 'men',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 18,
      sizeStock: { S: 12, M: 18, L: 7, XL: 0 },
      tags: ['new'],
      placements: ['men', 'new-arrivals'],
      badge: 'pnew',
      badgeText: 'New',
      bgClass: 'b5',
      swatches: ['#FAF7F2', '#B0B8C0', '#C8BAB0'],
      imageClass: 'linen',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: createId(),
      name: 'Silk Plisse Blouse',
      price: 285,
      description: 'A soft silk blouse with pleated movement.',
      category: 'women',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 28,
      sizeStock: { S: 14, M: 9, L: 5, XL: 0 },
      tags: ['new', 'featured'],
      placements: ['women', 'new-arrivals', 'home-essentials'],
      badge: 'pnew',
      badgeText: 'New',
      bgClass: 'b3',
      swatches: ['#FAF7F2', '#8f9390'],
      imageClass: 'silk',
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      _id: createId(),
      name: 'Twill Chino Trousers',
      price: 290,
      description: 'Structured twill trousers for the tailored menswear edit.',
      category: 'men',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 8,
      sizeStock: { S: 0, M: 3, L: 5, XL: 0 },
      tags: ['sale'],
      placements: ['men', 'sales'],
      badge: 'pltd',
      badgeText: 'Limited',
      bgClass: 'b11',
      swatches: ['#C8BAB0', '#1A1A1A'],
      imageClass: 'denim',
      createdAt: new Date(Date.now() - 86400000 * 16),
      updatedAt: new Date(Date.now() - 86400000),
    },
    {
      _id: createId(),
      name: 'Raffia Structured Tote',
      price: 175,
      description: 'A hand-finished raffia tote for everyday styling.',
      category: 'accessories',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 0,
      sizeStock: { S: 0, M: 0, L: 0, XL: 0 },
      tags: ['new'],
      placements: ['accessories', 'new-arrivals'],
      badge: 'pnew',
      badgeText: 'New',
      bgClass: 'b7',
      swatches: ['#C8BAB0', '#1A1A1A'],
      imageClass: 'linen',
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      _id: createId(),
      name: 'Cashmere Roll-Neck',
      price: 380,
      description: 'A limited cashmere knit with a clean seasonal silhouette.',
      category: 'women',
      images: [],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 22,
      sizeStock: { S: 12, M: 11, L: 0, XL: 0 },
      tags: ['featured'],
      placements: ['women', 'tops', 'home-essentials'],
      badge: 'pltd',
      badgeText: 'Limited',
      bgClass: 'b9',
      swatches: ['#B8C2AA', '#C8BAB0', '#1A1A1A'],
      imageClass: 'wool',
      createdAt: new Date(Date.now() - 86400000 * 20),
      updatedAt: new Date(Date.now() - 86400000 * 4),
    }
  );
};

const seedBusinessData = async () => {
  const admin = await seedAdmin();
  seedProducts();

  const sampleUsers = [
    {
      _id: createId(),
      name: 'Maya Perera',
      email: 'customer@atelier.com',
      createdAt: new Date(Date.now() - 86400000 * 14),
      updatedAt: new Date(Date.now() - 86400000 * 14),
    },
    {
      _id: createId(),
      name: 'Nehan Fernando',
      email: 'nehan@example.com',
      createdAt: new Date(Date.now() - 86400000 * 32),
      updatedAt: new Date(Date.now() - 86400000 * 8),
    },
    {
      _id: createId(),
      name: 'Aisha Silva',
      email: 'aisha@example.com',
      createdAt: new Date(Date.now() - 86400000 * 48),
      updatedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      _id: createId(),
      name: 'Kavindu Jay',
      email: 'kavindu@example.com',
      createdAt: new Date(Date.now() - 86400000 * 6),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  for (const sample of sampleUsers) {
    if (!store.users.some((user) => user.email === sample.email)) {
      store.users.push({
        ...sample,
        password: await bcrypt.hash('customer12345', 10),
        role: 'user',
      });
    }
  }

  if (!store.orders.length) {
    const users = store.users.filter((user) => user.role === 'user');
    const makeOrder = (user, productIndexes, status, daysAgo, phone) => {
      const items = productIndexes.map(([index, quantity, size]) => {
        const product = store.products[index];
        return {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity,
          size,
          imageClass: product.imageClass,
        };
      });
      return {
        _id: createId(),
        user: user._id,
        items,
        totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status,
        address: {
          fullName: user.name,
          line1: `${21 + daysAgo} Atelier Lane`,
          line2: '',
          city: daysAgo % 2 ? 'Colombo' : 'Kandy',
          postalCode: '00100',
          country: 'Sri Lanka',
          phone,
        },
        createdAt: new Date(Date.now() - 86400000 * daysAgo),
        updatedAt: new Date(Date.now() - 86400000 * Math.max(1, daysAgo - 1)),
      };
    };

    store.orders.push(
      makeOrder(users[0] || admin, [[0, 2, 'S'], [2, 1, 'M']], 'processing', 3, '+94 77 111 2233'),
      makeOrder(users[1] || admin, [[1, 1, 'M'], [4, 1, 'S']], 'pending', 8, '+94 76 222 3344'),
      makeOrder(users[2] || admin, [[3, 3, 'M']], 'shipped', 18, '+94 71 333 4455'),
      makeOrder(users[3] || admin, [[5, 1, 'S'], [0, 1, 'L']], 'delivered', 31, '+94 75 444 5566'),
      makeOrder(users[0] || admin, [[2, 2, 'L']], 'delivered', 45, '+94 77 111 2233')
    );
  }

  if (!store.expenses.length) {
    store.expenses.push(
      { _id: createId(), title: 'Linen fabric order', category: 'Material cost', amount: 320, date: new Date(Date.now() - 86400000 * 6), createdAt: new Date() },
      { _id: createId(), title: 'Courier pickups', category: 'Shipping cost', amount: 85, date: new Date(Date.now() - 86400000 * 4), createdAt: new Date() },
      { _id: createId(), title: 'Lookbook ads', category: 'Marketing', amount: 140, date: new Date(Date.now() - 86400000 * 2), createdAt: new Date() },
      { _id: createId(), title: 'Silk lining batch', category: 'Material cost', amount: 210, date: new Date(Date.now() - 86400000 * 17), createdAt: new Date() },
      { _id: createId(), title: 'Instagram campaign', category: 'Marketing', amount: 180, date: new Date(Date.now() - 86400000 * 25), createdAt: new Date() }
    );
  }

  if (!store.bulkCustomers.length) {
    store.bulkCustomers.push(
      { _id: createId(), name: 'Ceylon Boutique Co.', email: 'orders@ceylonboutique.lk', company: 'Ceylon Boutique', discount: 12, notes: 'Prefers linen and tote restocks', createdAt: new Date(Date.now() - 86400000 * 9) },
      { _id: createId(), name: 'Galle Resort Retail', email: 'retail@galleresort.lk', company: 'Galle Resort', discount: 18, notes: 'Monthly accessories order', createdAt: new Date(Date.now() - 86400000 * 21) }
    );
  }
};

module.exports = { store, createId, seedAdmin, seedProducts, seedBusinessData };
