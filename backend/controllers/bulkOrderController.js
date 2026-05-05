const { store, createId } = require('../data/memoryStore');

const getBulkCustomers = async (req, res) => {
  res.json(global.useMemoryStore ? store.bulkCustomers : []);
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
  }

  res.status(201).json(customer);
};

module.exports = { getBulkCustomers, createBulkCustomer };
