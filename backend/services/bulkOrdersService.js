const BULK_ORDER_STATUSES = ['Pending', 'Approved', 'Production', 'Completed', 'Cancelled'];

const bulkOrders = [];

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
