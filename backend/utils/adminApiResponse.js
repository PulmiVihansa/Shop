const asArray = (records) => {
  if (Array.isArray(records)) return records;
  if (records && Array.isArray(records.data)) return records.data;
  return [];
};

const logEndpointRecords = (endpoint, records) => {
  const list = asArray(records);
  console.log({
    endpoint,
    count: list.length,
    sample: list[0] || null,
  });
};

const sendAdminList = (res, endpoint, records = [], extra = {}) => {
  const data = asArray(records);
  logEndpointRecords(endpoint, data);
  return res.json({
    success: true,
    data,
    count: data.length,
    sample: data[0] || null,
    ...extra,
  });
};

const sendAdminObject = (res, endpoint, data = {}, extra = {}) => {
  const record = data && typeof data === 'object' ? data : {};
  const listKey = ['records', 'orders', 'customers', 'transactions', 'invoices', 'expenseItems', 'kpis', 'summary']
    .find((key) => Array.isArray(record[key]));
  const list = listKey ? record[listKey] : [];
  const count = listKey ? list.length : Object.keys(record).length ? 1 : 0;
  const sample = listKey ? list[0] || null : Object.keys(record).length ? record : null;
  console.log({
    endpoint,
    count,
    sample,
  });
  return res.json({
    success: true,
    data: record,
    count,
    sample,
    ...record,
    ...extra,
  });
};

const sendAdminEmpty = (res, endpoint, error, fallback = []) => {
  if (error) {
    console.error({ endpoint, error: error.message || error });
  }
  const data = Array.isArray(fallback) ? fallback : [];
  console.log({
    endpoint,
    count: data.length,
    sample: data[0] || null,
  });
  return res.json({
    success: true,
    data,
    count: data.length,
    sample: data[0] || null,
    error: error?.message,
  });
};

module.exports = {
  logEndpointRecords,
  sendAdminEmpty,
  sendAdminList,
  sendAdminObject,
};
