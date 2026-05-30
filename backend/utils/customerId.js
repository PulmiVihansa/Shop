const formatCustomerId = (prefix, index) => `${prefix}-${String(index).padStart(3, '0')}`;

const parseCustomerId = (value, prefix) => {
  if (!value || typeof value !== 'string') return null;
  const label = `${prefix}-`;
  if (!value.startsWith(label)) return null;
  const parsed = Number(value.slice(label.length));
  return Number.isFinite(parsed) ? parsed : null;
};

const getMaxIndex = (values, prefix) =>
  values.reduce((max, entry) => {
    const parsed = parseCustomerId(entry, prefix);
    return parsed && parsed > max ? parsed : max;
  }, 0);

const getNextCustomerId = async (prisma, prefix) => {
  const latest = await prisma.user.findFirst({
    where: { customerId: { startsWith: `${prefix}-` } },
    orderBy: { customerId: 'desc' },
    select: { customerId: true }
  });
  const last = parseCustomerId(latest?.customerId, prefix) || 0;
  return formatCustomerId(prefix, last + 1);
};

const ensureCustomerIds = async (prisma) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, customerId: true }
  });
  const existingIds = users.map((user) => user.customerId).filter(Boolean);
  let nextCustomerIndex = getMaxIndex(existingIds, 'CUS') + 1;
  let nextAdminIndex = getMaxIndex(existingIds, 'ADMIN') + 1;

  const updates = [];
  const adminUsers = users.filter((user) => user.role === 'admin');
  const standardUsers = users.filter((user) => user.role !== 'admin');

  adminUsers.forEach((user) => {
    if (user.customerId) return;
    const adminId = existingIds.includes('ADMIN-001')
      ? formatCustomerId('ADMIN', nextAdminIndex++)
      : 'ADMIN-001';
    updates.push(
      prisma.user.update({
        where: { id: user.id },
        data: { customerId: adminId }
      })
    );
    existingIds.push(adminId);
    if (adminId === 'ADMIN-001' && nextAdminIndex === 1) nextAdminIndex = 2;
  });

  standardUsers.forEach((user) => {
    if (user.customerId) return;
    const customerId = formatCustomerId('CUS', nextCustomerIndex++);
    updates.push(
      prisma.user.update({
        where: { id: user.id },
        data: { customerId }
      })
    );
    existingIds.push(customerId);
  });

  if (updates.length) {
    await Promise.all(updates);
  }
};

const backfillOrderCustomerIds = async (prisma) => {
  const orders = await prisma.order.findMany({
    select: { id: true, userId: true, customerId: true }
  });
  const missing = orders.filter((order) => !order.customerId);
  if (!missing.length) return;

  const users = await prisma.user.findMany({
    select: { id: true, customerId: true }
  });
  const userMap = new Map(users.map((user) => [String(user.id), user.customerId]));

  const updates = missing
    .map((order) => {
      const customerId = userMap.get(String(order.userId));
      if (!customerId) return null;
      return prisma.order.update({
        where: { id: order.id },
        data: { customerId }
      });
    })
    .filter(Boolean);

  if (updates.length) {
    await Promise.all(updates);
  }
};

module.exports = {
  formatCustomerId,
  getNextCustomerId,
  ensureCustomerIds,
  backfillOrderCustomerIds
};
