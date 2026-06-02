const BULK_ORDER_STATUSES = ['Pending', 'Approved', 'Production', 'Completed', 'Cancelled'];

const bulkOrders = [
  {
    id: 'BULK-2041',
    company: 'Ceylon Boutique Group',
    contactPerson: 'Rivanya Silva',
    email: 'rivanya@ceylonboutique.lk',
    phone: '+94 77 440 2211',
    quantity: 240,
    budget: 2350000,
    status: 'Pending',
    date: '2026-05-29',
    deliveryDate: '2026-07-10',
    requestedProducts: ['Linen Oxford Shirt', 'Raffia Structured Tote'],
    notes: 'Needs custom woven label and staggered shipment.'
  },
  {
    id: 'BULK-2038',
    company: 'Maison Lune Resort',
    contactPerson: 'Amara Jay',
    email: 'amara@maisonlune.com',
    phone: '+94 76 118 4400',
    quantity: 180,
    budget: 1840000,
    status: 'Approved',
    date: '2026-05-25',
    deliveryDate: '2026-06-28',
    requestedProducts: ['Silk Scarf Botanical', 'Canvas Weekend Tote'],
    notes: 'Resort capsule packaging requested.'
  },
  {
    id: 'BULK-2034',
    company: 'Atelier North Wholesale',
    contactPerson: 'Noah Laurent',
    email: 'noah@ateliernorth.fr',
    phone: '+33 6 18 44 90 10',
    quantity: 320,
    budget: 3120000,
    status: 'Production',
    date: '2026-05-18',
    deliveryDate: '2026-06-20',
    requestedProducts: ['Silk Wrap Maxi', 'Velvet Column Gown'],
    notes: 'Priority production slot confirmed.'
  },
  {
    id: 'BULK-2029',
    company: 'Serene Retail Collective',
    contactPerson: 'Leah Fernando',
    email: 'leah@sereneretail.lk',
    phone: '+94 71 990 1188',
    quantity: 90,
    budget: 740000,
    status: 'Completed',
    date: '2026-05-02',
    deliveryDate: '2026-05-31',
    requestedProducts: ['Woven Leather Belt', 'Leather Card Holder'],
    notes: 'Delivered with branded invoice pack.'
  }
];

const getBulkOrdersDashboard = () => {
  const statusTotals = BULK_ORDER_STATUSES.reduce((accumulator, status) => {
    const items = bulkOrders.filter((order) => order.status === status);
    const totalBudget = items.reduce((sum, order) => sum + Number(order.budget || 0), 0);
    accumulator.push({
      label: status,
      value: items.length,
      revenue: totalBudget,
      growth: totalBudget,
      trend: 'up'
    });
    return accumulator;
  }, []);

  const totalBudget = bulkOrders.reduce((sum, order) => sum + Number(order.budget || 0), 0);

  return {
    summary: [
      ...statusTotals,
      { label: 'Bulk Revenue', value: totalBudget, growth: 18.9, trend: 'up' }
    ],
    orders: bulkOrders.map((order) => ({ ...order }))
  };
};

const updateBulkOrderPipeline = (orderId, status) => {
  if (!BULK_ORDER_STATUSES.includes(status)) {
    const error = new Error('Invalid bulk order status');
    error.statusCode = 400;
    throw error;
  }

  const order = bulkOrders.find((item) => item.id === orderId);
  if (!order) {
    const error = new Error('Bulk order not found');
    error.statusCode = 404;
    throw error;
  }

  order.status = status;
  return { ...order };
};

module.exports = { getBulkOrdersDashboard, updateBulkOrderPipeline, BULK_ORDER_STATUSES };
