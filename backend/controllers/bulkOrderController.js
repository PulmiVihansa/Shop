const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const getBulkCustomers = async (req, res) => {
  if (global.useMemoryStore) {
    return res.json(store.bulkCustomers);
  }

  const customers = await prisma.bulkCustomer.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(customers.map(withId));
};

const createBulkCustomer = async (req, res) => {
  const { name, email, company, discount = 0, notes = '' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const customer = {
    _id: createId(),
    name,
    email,
    company,
    discount: Number(discount || 0),
    notes,
    createdAt: new Date()
  };

  if (global.useMemoryStore) {
    store.bulkCustomers.unshift(customer);
    return res.status(201).json(customer);
  }

  const saved = await prisma.bulkCustomer.create({
    data: { name, email, company, discount: Number(discount || 0), notes }
  });
  res.status(201).json(withId(saved));
};

module.exports = { getBulkCustomers, createBulkCustomer };
