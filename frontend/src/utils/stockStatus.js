export const STOCK_STATUS = {
  in: {
    label: 'IN STOCK',
    detailLabel: '✓ IN STOCK',
    className: 'in',
    color: '#2e8b57',
  },
  low: {
    label: 'LOW STOCK',
    detailLabel: '⚠ LOW STOCK',
    className: 'low',
    color: '#d4a24c',
  },
  out: {
    label: 'OUT OF STOCK',
    detailLabel: '✕ OUT OF STOCK',
    className: 'out',
    color: '#c0392b',
  },
};

export const getTotalStock = (product = {}) => {
  const sizeStock = product?.sizeStock && typeof product.sizeStock === 'object' ? product.sizeStock : null;
  if (sizeStock) {
    return Object.values(sizeStock).reduce((sum, value) => sum + Math.max(0, Math.trunc(Number(value || 0))), 0);
  }
  return Math.max(0, Math.trunc(Number(product?.stock || 0)));
};

export const getStockStatus = (productOrStock) => {
  const total = typeof productOrStock === 'number' ? productOrStock : getTotalStock(productOrStock);
  if (total <= 0) return STOCK_STATUS.out;
  if (total <= 10) return STOCK_STATUS.low;
  return STOCK_STATUS.in;
};
