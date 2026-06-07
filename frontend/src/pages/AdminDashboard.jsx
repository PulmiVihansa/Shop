import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaCog,
  FaCreditCard,
  FaDatabase,
  FaDownload,
  FaEnvelope,
  FaEye,
  FaFileInvoice,
  FaGlobe,
  FaPalette,
  FaPaperPlane,
  FaSave,
  FaSearch,
  FaSearchDollar,
  FaShareAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaStore,
  FaTruck,
  FaUpload,
} from 'react-icons/fa';
import api, { getErrorMessage } from '../services/api.js';
import InventoryManagementPanel from '../components/admin/InventoryManagementPanel.jsx';
import { COLLECTION_OPTIONS, getCategoryOptions } from '../utils/productStructure.js';
import { getStockStatus, getTotalStock } from '../utils/stockStatus.js';
import { resolveImageUrl } from '../utils/imageUrl.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import adminLogo from '../assets/Name 2.png';
import '../styles/admin.css';

const money = (value) => `LKR${Number(value || 0).toLocaleString()}`;
const formatLkr = (value) => `LKR ${Number(value || 0).toLocaleString()}`;
const apiFileBase = () => String(api.defaults.baseURL || '').replace(/\/api\/?$/, '');
const invoicePdfFileUrl = (invoice) => invoice?.pdfUrl ? `${apiFileBase()}${invoice.pdfUrl}` : '';
const ADMIN_DATA_CACHE_MS = 60_000;
const adminBaseDataCache = {
  fetchedAt: 0,
  promise: null,
  data: null,
};
const financeDataCache = new Map();

const fetchAdminDashboardData = (expenseFilter, { force = false } = {}) => {
  const financeKey = expenseFilter || 'all';
  const isBaseFresh = adminBaseDataCache.data && Date.now() - adminBaseDataCache.fetchedAt < ADMIN_DATA_CACHE_MS;
  const financeEntry = financeDataCache.get(financeKey);
  const isFinanceFresh = financeEntry?.data && Date.now() - financeEntry.fetchedAt < ADMIN_DATA_CACHE_MS;

  const basePromise = !force && isBaseFresh
    ? Promise.resolve(adminBaseDataCache.data)
    : (!force && adminBaseDataCache.promise) || Promise.allSettled([
    api.get('/products'),
    api.get('/orders'),
    api.get('/users'),
    api.get('/analytics'),
    api.get('/bulk-orders'),
    api.get('/bulk-orders/customers'),
    api.get('/transactions'),
    api.get('/invoices', { params: { limit: 1000 } }),
    api.get('/settings/payment'),
    api.get('/content/homepage'),
    api.get('/content/banners'),
    api.get('/settings'),
    api.get('/sales/admin'),
    api.get('/featured-products/admin'),
  ]).then((results) => {
    const getResult = (index, fallback) => {
      const result = results[index];
      if (result.status === 'fulfilled') return result.value.data;
      console.error(result.reason);
      return fallback;
    };

    const data = {
      productData: getResult(0, []),
      orderData: getResult(1, []),
      userData: getResult(2, []),
      analyticsData: getResult(3, null),
      bulkData: getResult(4, { summary: [], orders: [] }),
      bulkCustomerData: getResult(5, []),
      transactionData: getResult(6, []),
      invoiceData: getResult(7, { summary: [], invoices: [] }),
      paymentSettingsData: getResult(8, {}),
      homepageData: getResult(9, null),
      bannerData: getResult(10, []),
      settingsData: getResult(11, {}),
      salesData: getResult(12, []),
      featuredData: getResult(13, []),
    };

    adminBaseDataCache.data = data;
    adminBaseDataCache.fetchedAt = Date.now();
    return data;
  }).finally(() => {
    adminBaseDataCache.promise = null;
  });

  if (!force && !isBaseFresh && !adminBaseDataCache.promise) {
    adminBaseDataCache.promise = basePromise;
  }

  const financePromise = !force && isFinanceFresh
    ? Promise.resolve(financeEntry.data)
    : (!force && financeEntry?.promise) || api
      .get('/finance', { params: { category: expenseFilter === 'all' ? undefined : expenseFilter } })
      .then((response) => {
        const data = response.data;
        financeDataCache.set(financeKey, { data, fetchedAt: Date.now(), promise: null });
        return data;
      })
      .catch((error) => {
        console.error(error);
        return null;
      });

  if (!force && !isFinanceFresh) {
    financeDataCache.set(financeKey, {
      data: financeEntry?.data || null,
      fetchedAt: financeEntry?.fetchedAt || 0,
      promise: financePromise,
    });
  }

  return Promise.all([basePromise, financePromise]).then(([baseData, financeData]) => ({
    ...baseData,
    financeData,
  }));
};
const buildInvoiceEmailMessage = (invoice) => [
  `Dear ${invoice.customer || invoice.customerName || 'Customer'},`,
  '',
  'Thank you for choosing Astravia.',
  '',
  'Your order has been successfully confirmed and your official invoice is attached for your records.',
  '',
  `Order ID: ${invoice.orderId || ''}`,
  `Transaction ID: ${invoice.transactionId || ''}`,
  `Invoice ID: ${invoice.invoiceId || invoice.invoiceNumber || ''}`,
  `Order Date: ${formatDateTime(invoice.date || invoice.issueDate)}`,
  '',
  'We appreciate your trust in Astravia and look forward to serving you again.',
  '',
  'Thank you for being part of the Astravia experience.',
  '',
  'Astravia Luxury Fashion House',
].join('\n');
const compactMoney = (value) => {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1000000) return `LKR ${(number / 1000000).toFixed(number % 1000000 ? 1 : 0)}M`;
  if (Math.abs(number) >= 1000) return `LKR ${(number / 1000).toFixed(number % 1000 ? 1 : 0)}K`;
  return `LKR ${number.toLocaleString()}`;
};
const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
const SIZE_SET = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const newSizeStock = () => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
const PRODUCT_BADGE_OPTIONS = ['New Arrival', 'Best Seller', 'Limited Edition', 'Featured Product'];

const splitCommaValues = (value) => String(value || '').split(',').map((item) => item.trim()).filter(Boolean);

const getReviewStats = (reviews = []) => {
  if (!reviews.length) return { rating: 0, reviewCount: 0 };
  const total = reviews.reduce((sum, review) => sum + Math.min(5, Math.max(0, Number(review.rating || 0))), 0);
  return {
    rating: Number((total / reviews.length).toFixed(1)),
    reviewCount: reviews.length,
  };
};

const getInitials = (name = '', email = '') => {
  const trimmed = String(name || email || '').trim();
  if (!trimmed) return 'CU';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const parseReviewList = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const makeEmptyProduct = () => ({
  name: '',
  slug: '',
  price: '',
  colors: '',
  description: '',
  collection: 'men',
  category: getCategoryOptions('men')[0] || '',
  badges: '',
  material: '',
  fabric: '',
  fit: '',
  careInstructions: '',
  countryOfOrigin: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  rating: '',
  reviewCount: '',
  reviews: '',
  sizeStock: newSizeStock(),
  images: [],
  imageUploads: [],
});

const getCollectionLabel = (value) => COLLECTION_OPTIONS.find((option) => option.value === value)?.label || value || '-';

const emptyExpense = { title: '', category: 'Material cost', amount: '' };
const todayInputValue = () => new Date().toISOString().slice(0, 10);
const emptySaleForm = () => ({
  productId: '',
  originalPrice: '',
  salePrice: '',
  badge: 'Sale',
  startDate: todayInputValue(),
  endDate: todayInputValue(),
  isActive: true,
});
const emptyFeaturedForm = () => ({
  productId: '',
  displayOrder: 0,
  isActive: true,
});
const toInputDate = (value) => {
  if (!value) return todayInputValue();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return todayInputValue();
  return date.toISOString().slice(0, 10);
};

const menuItems = [
  'Dashboard',
  'Products',
  'Sales',
  'Orders',
  'Customers',
  'Inventory',
  'Finance',
  'Analytics',
  'Marketing',
  'Bulk Orders',
  'Transactions',
  'Invoices',
  'CMS',
  'Settings',
];

function MetricCard({ label, value, note }) {
  const metricClass = String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const isRevenue = /revenue|amount|value|sales|profit|cash|income|total/i.test(String(label || ''));

  return (
    <div className={`admin-metric metric-${metricClass} ${isRevenue ? 'metric-revenue' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <p>{note}</p>}
    </div>
  );
}

function DataTable({ columns, rows, empty = 'No records yet.' }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>{columns.map((column) => <th key={column.key} className={column.className || ''}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>{empty}</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key} className={column.className || ''}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarChart({ data, valueKey = 'revenue', labelKey = 'label' }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);
  return (
    <div className="admin-chart">
      {data.length === 0 ? <p>No chart data yet.</p> : data.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const percent = Math.round((value / max) * 100);
        return (
          <div className="admin-bar-row" key={`${item[labelKey]}-${valueKey}`} title={`${item[labelKey]}: ${value.toLocaleString()}`}>
            <span>{item[labelKey]}</span>
            <div><i style={{ width: `${percent}%`, '--bar-index': index }} /></div>
            <strong>{value.toLocaleString()}%</strong>
          </div>
        );
      })}
    </div>
  );
}

function ColumnChart({ data, valueKey = 'revenue', labelKey = 'label', tone = 'gold' }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);
  return (
    <div className={`admin-column-chart ${tone}`}>
      {data.length === 0 ? <p>No chart data yet.</p> : data.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        const height = Math.max(8, (value / max) * 100);
        return (
          <div className="admin-column" key={`${item[labelKey]}-${valueKey}`} title={`${item[labelKey]}: ${value.toLocaleString()}`}>
            <strong>{value.toLocaleString()}</strong>
            <div><i style={{ height: `${height}%`, '--column-index': index }} /></div>
            <span>{item[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function PieChart({ data, valueKey = 'amount', labelKey = 'label' }) {
  const total = data.reduce((sum, item) => sum + Number(item[valueKey] || 0), 0);
  let offset = 25;
  const colors = ['#C8A97E', '#1B1B1B', '#A7B29A', '#7D8683', '#E8DFD4'];
  const isShareData = total <= 100;

  if (!total) {
    return <div className="premium-chart-empty">No chart data yet.</div>;
  }

  return (
    <div className="premium-donut-chart">
      <div className="premium-donut-figure">
        <svg className="admin-pie premium-donut-svg" viewBox="0 0 42 42" aria-label="Revenue distribution chart">
          <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eee8df" strokeWidth="6.5" />
          {data.map((item, index) => {
            const value = Number(item[valueKey] || 0);
            const dash = (value / total) * 100;
            const circle = (
              <circle
                key={item[labelKey]}
                cx="21"
                cy="21"
                r="15.915"
                fill="transparent"
                stroke={colors[index % colors.length]}
                strokeWidth="6.5"
                strokeDasharray={`${dash} ${100 - dash}`}
                strokeDashoffset={offset}
              >
                <title>{`${item[labelKey]}: ${Math.round(dash)}%`}</title>
              </circle>
            );
            offset -= dash;
            return circle;
          })}
        </svg>
        <div className="premium-donut-center">
          <span>Total</span>
          <strong>{isShareData ? '100%' : compactMoney(total)}</strong>
        </div>
      </div>
      <div className="premium-donut-legend">
        {data.map((item, index) => {
          const value = Number(item[valueKey] || 0);
          const percent = Math.round((value / total) * 100);
          return (
            <div className="premium-donut-row" key={item[labelKey]}>
              <span><i style={{ background: colors[index % colors.length] }} />{item[labelKey]}</span>
              <strong>{percent}%</strong>
              <em>{isShareData ? `${value}% share` : money(value)}</em>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PremiumMetricCard({ item }) {
  const formatted = item.suffix === '%' ? `${Number(item.value || 0).toFixed(1)}%` : typeof item.value === 'number' && item.value > 999 ? money(item.value) : item.value;
  const note = item.note || (item.growth !== undefined ? `${item.trend === 'down' ? '↓' : '↑'} ${Math.abs(Number(item.growth || 0))}%` : '');
  const metricNote = item.note || (item.growth !== undefined ? `${item.trend === 'down' ? 'Down' : 'Up'} ${Math.abs(Number(item.growth || 0))}%` : '');
  const metricClass = String(item.label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const isRevenue = /revenue|amount|value|sales|profit|cash|income|total/i.test(String(item.label || ''));

  return (
    <article className={`premium-metric-card metric-${metricClass} ${isRevenue ? 'metric-revenue' : ''}`}>
      {item.icon && <span className="premium-metric-icon" aria-hidden="true">{item.icon}</span>}
      <span>{item.label}</span>
      <strong>{formatted}</strong>
      {metricNote && <p className={item.trend === 'down' ? 'down' : 'up'}>{metricNote}</p>}
    </article>
  );
  return (
    <article className="premium-metric-card">
      <span>{item.label}</span>
      <strong>{formatted}</strong>
      <p className={item.trend === 'down' ? 'down' : 'up'}>{item.trend === 'down' ? '↓' : '↑'} {Math.abs(Number(item.growth || 0))}%</p>
    </article>
  );
}

const lineChartTones = {
  revenue: { line: '#C8A97E', soft: '#E8DFD4', glow: 'rgba(200, 169, 126, 0.28)' },
  profit: { line: '#A7B29A', soft: '#DCE2D4', glow: 'rgba(167, 178, 154, 0.3)' },
};

const niceChartMax = (value) => {
  if (!value) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const normalized = value / power;
  const rounded = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return rounded * power;
};

const smoothPath = (points) => points.reduce((path, point, index) => {
  if (index === 0) return `M ${point.x},${point.y}`;
  const previous = points[index - 1];
  const middle = (previous.x + point.x) / 2;
  return `${path} C ${middle},${previous.y} ${middle},${point.y} ${point.x},${point.y}`;
}, '');

const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const normalizeWeekdaySeries = (series = [], valueKey) => {
  const lookup = new Map(series.map((item) => [String(item?.label || '').slice(0, 3), Number(item?.[valueKey] || 0)]));
  return weekdayOrder.map((label) => ({ label, [valueKey]: lookup.get(label) || 0 }));
};

const getCustomerName = (order) => order?.customerName || order?.user?.name || order?.name || order?.email || order?.customerEmail || 'Customer';

const getCustomerEmail = (order) => order?.customerEmail || order?.user?.email || order?.email || '';

const getCustomerKey = (order) => String(order?.customerEmail || order?.user?.email || order?.email || order?.customerId || order?.userId || getCustomerName(order)).toLowerCase();

const buildTopCustomers = (orders = []) => {
  const grouped = new Map();

  orders.forEach((order) => {
    const key = getCustomerKey(order);
    if (!key) return;

    const revenue = Number(order?.totalAmount ?? order?.totalPrice ?? 0);
    const orderDate = order?.orderDate || order?.createdAt || null;
    const name = getCustomerName(order);
    const email = getCustomerEmail(order);
    const existing = grouped.get(key) || {
      id: key,
      name,
      email,
      orders: 0,
      revenue: 0,
      lastOrder: null,
    };

    existing.orders += 1;
    existing.revenue += revenue;
    if (orderDate && (!existing.lastOrder || new Date(orderDate) > new Date(existing.lastOrder))) {
      existing.lastOrder = orderDate;
    }
    grouped.set(key, existing);
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)
    .map((customer) => ({
      ...customer,
      avgOrder: customer.orders ? customer.revenue / customer.orders : 0,
      initials: getInitials(customer.name, customer.email),
    }));
};

const buildSizePerformance = (orders = []) => {
  const sizeCounts = new Map([
    ['XS', 0],
    ['S', 0],
    ['M', 0],
    ['L', 0],
    ['XL', 0],
    ['XXL', 0],
    ['ONE SIZE', 0],
  ]);

  orders.forEach((order) => {
    const items = Array.isArray(order?.items) && order.items.length ? order.items : [{ size: order?.size, quantity: order?.quantity || 1 }];
    items.forEach((item) => {
      const size = String(item?.size || order?.size || 'One Size').trim().toUpperCase();
      const quantity = Number(item?.quantity || order?.quantity || 1);
      if (sizeCounts.has(size)) {
        sizeCounts.set(size, sizeCounts.get(size) + quantity);
      } else {
        sizeCounts.set('ONE SIZE', sizeCounts.get('ONE SIZE') + quantity);
      }
    });
  });

  return Array.from(sizeCounts.entries())
    .filter(([, value]) => value > 0)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
};

function PremiumHorizontalBarChart({ data, valueKey = 'value', labelKey = 'label' }) {
  const max = Math.max(...data.map((item) => Number(item?.[valueKey] || 0)), 1);

  if (!data.length) {
    return <div className="premium-chart-empty">No chart data yet.</div>;
  }

  return (
    <div className="premium-ranking-chart">
      {data.map((item, index) => {
        const value = Number(item?.[valueKey] || 0);
        const percent = Math.max(8, Math.round((value / max) * 100));
        return (
          <div className="premium-ranking-row" key={`${item?.[labelKey]}-${index}`} title={`${item?.[labelKey]}: ${value.toLocaleString()}`}>
            <div className="premium-ranking-meta">
              <strong>{item?.[labelKey]}</strong>
              <span>{value.toLocaleString()}</span>
            </div>
            <div className="premium-ranking-track"><i style={{ width: `${percent}%` }} /></div>
          </div>
        );
      })}
    </div>
  );
}

function PremiumLineChart({ data, valueKey, tone = 'revenue' }) {
  const chartData = data || [];
  const rawMax = Math.max(...chartData.map((item) => Number(item[valueKey] || 0)), 1);
  const max = niceChartMax(rawMax);
  const palette = lineChartTones[tone] || lineChartTones.revenue;
  const bounds = { left: 72, right: 690, top: 28, bottom: 236 };
  const points = chartData.map((item, index) => {
    const x = chartData.length === 1 ? (bounds.left + bounds.right) / 2 : bounds.left + (index / (chartData.length - 1)) * (bounds.right - bounds.left);
    const y = bounds.top + (1 - (Number(item[valueKey] || 0) / max)) * (bounds.bottom - bounds.top);
    return { ...item, value: Number(item[valueKey] || 0), x, y };
  });
  const path = smoothPath(points);
  const areaPath = points.length ? `${path} L ${points[points.length - 1].x},${bounds.bottom} L ${points[0].x},${bounds.bottom} Z` : '';
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => ({ ratio, value: max * ratio, y: bounds.top + (1 - ratio) * (bounds.bottom - bounds.top) }));
  const peak = Math.max(...points.map((point) => point.value), 0);
  const xLabelStep = chartData.length <= 12 ? 1 : Math.max(1, Math.ceil((chartData.length - 1) / 6));
  const visibleXPoints = points.filter((point, index) => {
    if (chartData.length <= 12) return true;
    return index === 0 || index === points.length - 1 || index % xLabelStep === 0;
  });

  return (
    <div className="premium-line-chart" style={{ '--chart-line': palette.line, '--chart-soft': palette.soft, '--chart-glow': palette.glow }}>
      {chartData.length === 0 ? <div className="premium-chart-empty">No chart data yet.</div> : (
        <>
          <div className="premium-chart-meta">
            <span>Peak</span>
            <strong>{compactMoney(peak)}</strong>
          </div>
          <svg viewBox="0 0 720 340" role="img" aria-label={`${valueKey} revenue trend chart`}>
            <defs>
              <linearGradient id={`${valueKey}-area`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={palette.line} stopOpacity="0.2" />
                <stop offset="100%" stopColor={palette.soft} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {ticks.map((tick) => (
              <g key={tick.ratio}>
                <line className="premium-chart-grid" x1={bounds.left} x2={bounds.right} y1={tick.y} y2={tick.y} />
                <text className="premium-chart-y-label" x="10" y={tick.y + 4}>{compactMoney(tick.value)}</text>
              </g>
            ))}
            {visibleXPoints.map((point) => <line className="premium-chart-grid vertical" key={`${point.label}-${point.x}-grid`} x1={point.x} x2={point.x} y1={bounds.top} y2={bounds.bottom} />)}
            <line className="premium-chart-axis" x1={bounds.left} x2={bounds.left} y1={bounds.top} y2={bounds.bottom} />
            <line className="premium-chart-axis" x1={bounds.left} x2={bounds.right} y1={bounds.bottom} y2={bounds.bottom} />
            <path className="premium-chart-area" d={areaPath} fill={`url(#${valueKey}-area)`} />
            <path className="premium-chart-line" d={path} />
            {points.map((point) => (
              <g className="premium-chart-point" key={`${point.label}-${valueKey}`}>
                <circle cx={point.x} cy={point.y} r="5.5">
                  <title>{`${point.label}: ${money(point.value)}`}</title>
                </circle>
              </g>
            ))}
            {visibleXPoints.map((point) => <text className="premium-chart-x-label" key={`${point.label}-${point.x}-label`} x={point.x} y="304">{point.label}</text>)}
          </svg>
        </>
      )}
    </div>
  );
}

function PremiumDonutChart({ data }) {
  return <PieChart data={data} valueKey="value" />;
}

function StatusPill({ status }) {
  return <span className={`erp-status ${String(status || '').toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}

const BULK_ORDER_STATUSES = ['Pending', 'Approved', 'Production', 'Completed', 'Cancelled'];

const BULK_ORDER_STATUS_META = {
  Pending: { className: 'bulk-status-pending', label: 'Pending', note: 'Awaiting review' },
  Approved: { className: 'bulk-status-approved', label: 'Approved', note: 'Confirmed by sales' },
  Production: { className: 'bulk-status-production', label: 'Production', note: 'In manufacturing' },
  Completed: { className: 'bulk-status-completed', label: 'Completed', note: 'Delivered and closed' },
  Cancelled: { className: 'bulk-status-cancelled', label: 'Cancelled', note: 'Removed from pipeline' },
};

const normalizeBulkStatus = (status) => (BULK_ORDER_STATUSES.includes(status) ? status : 'Pending');

const getBulkStatusMeta = (status) => BULK_ORDER_STATUS_META[normalizeBulkStatus(status)];

const getBulkCompany = (order = {}) => order.companyName || order.company || '-';
const getBulkProducts = (order = {}) => {
  if (Array.isArray(order.products) && order.products.length) return order.products;
  if (Array.isArray(order.requestedProducts) && order.requestedProducts.length) return order.requestedProducts;
  return String(order.products || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};
const getBulkOrderValue = (order = {}) => Number(order.orderValue ?? order.budget ?? 0);
const getBulkDate = (order = {}) => order.createdAt || order.date || order.updatedAt || '';

const buildBulkMonthlyRevenue = (orders = []) => {
  const revenueByMonth = new Map();

  orders.forEach((order) => {
    const date = new Date(getBulkDate(order) || Date.now());
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const existing = revenueByMonth.get(key) || { key, label, revenue: 0 };
    existing.revenue += getBulkOrderValue(order);
    revenueByMonth.set(key, existing);
  });

  return Array.from(revenueByMonth.values()).sort((left, right) => left.key.localeCompare(right.key));
};

const buildBulkStatusMix = (orders = []) => BULK_ORDER_STATUSES.map((status) => ({
  label: status,
  value: orders.filter((order) => normalizeBulkStatus(order.status) === status).length,
})).filter((item) => item.value > 0);

const buildTopWholesaleClients = (orders = []) => {
  const byCompany = new Map();

  orders.forEach((order) => {
    const company = String(getBulkCompany(order) || 'Unknown Client').trim() || 'Unknown Client';
    const current = byCompany.get(company) || {
      id: company,
      company,
      contactPerson: order.contactPerson || '-',
      email: order.email || '',
      orders: 0,
      quantity: 0,
      revenue: 0,
      lastOrder: '',
    };

    current.orders += 1;
    current.quantity += Number(order.quantity || 0);
    current.revenue += getBulkOrderValue(order);
    current.contactPerson = current.contactPerson === '-' ? (order.contactPerson || '-') : current.contactPerson;
    current.email = current.email || order.email || '';

    const orderDate = getBulkDate(order);
    if (!current.lastOrder || String(orderDate) > String(current.lastOrder)) {
      current.lastOrder = orderDate;
    }

    byCompany.set(company, current);
  });

  return Array.from(byCompany.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      initials: getInitials(item.company, item.email),
      avgOrder: item.orders ? item.revenue / item.orders : 0,
    }));
};

const buildBulkCustomerRecords = (customers = []) => {
  return customers
    .map((customer) => {
      const company = customer.companyName || customer.company || '-';
      const stats = {
        orders: Number(customer.orders || 0),
        revenue: Number(customer.revenue || 0),
      };
      const lastOrder = customer.lastOrder || '';
      const status = stats.revenue >= 2000000 || Number(customer.discount || 0) >= 15
        ? 'VIP'
        : stats.orders > 0
          ? 'Active'
          : 'Inactive';

      return {
        id: customer.id || customer._id,
        name: customer.contactPerson || customer.name || '-',
        company,
        contactPerson: customer.contactPerson || customer.name || '-',
        phone: customer.phone || '-',
        email: customer.email || '-',
        discount: Number(customer.discount || 0),
        orders: stats.orders,
        revenue: stats.revenue,
        lastOrder,
        status,
        notes: customer.notes || '',
        initials: getInitials(company, customer.email),
      };
    })
    .sort((left, right) => right.revenue - left.revenue || right.orders - left.orders);
};

const bulkCustomerStatusClass = {
  VIP: 'bulk-customer-vip',
  Active: 'bulk-customer-active',
  Inactive: 'bulk-customer-inactive',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [active, setActive] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [bulkOrders, setBulkOrders] = useState({ summary: [], orders: [] });
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState({ summary: [], invoices: [] });
  const [bulkCustomers, setBulkCustomers] = useState([]);
  const [saleCampaigns, setSaleCampaigns] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [homepageContent, setHomepageContent] = useState(null);
  const [banners, setBanners] = useState([]);
  const [pageEditor, setPageEditor] = useState({ pageName: 'about', content: '' });
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', link: '', isActive: true });
  const [settings, setSettings] = useState({
    paymentProvider: 'PayHere',
    merchantId: '',
    merchantSecret: '',
    currency: 'LKR',
    enableCOD: true,
    enableOnlinePayment: true,
    sandboxMode: true,
    whatsappNumber: '',
  });
  const [productForm, setProductForm] = useState(makeEmptyProduct);
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [featuredForm, setFeaturedForm] = useState(emptyFeaturedForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [dashboardRange, setDashboardRange] = useState('30d');
  const [productSearch, setProductSearch] = useState('');
  const [expandedProductId, setExpandedProductId] = useState('');
  const [productPreview, setProductPreview] = useState(null);
  const [orderFilters, setOrderFilters] = useState({
    orderId: '',
    customerName: '',
    email: '',
    startDate: '',
    endDate: '',
    paymentStatus: 'all',
    orderStatus: 'all',
  });
  const [editingId, setEditingId] = useState(null);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [editingFeaturedId, setEditingFeaturedId] = useState(null);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedBulkOrder, setSelectedBulkOrder] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [emailComposer, setEmailComposer] = useState(null);
  const [selectedBulkCustomer, setSelectedBulkCustomer] = useState(null);
  const [invoiceFilters, setInvoiceFilters] = useState({ search: '', status: 'all', sort: 'desc', page: 1, pageSize: 8 });
  const [invoiceActionId, setInvoiceActionId] = useState('');
  const [settingsSearch, setSettingsSearch] = useState('');
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const toast = useToast();
  const mountedRef = useRef(false);

  const closeAdminTransientLayers = () => {
    setSelectedCustomer(null);
    setSelectedOrder(null);
    setSelectedExpense(null);
    setSelectedBulkOrder(null);
    setSelectedBulkCustomer(null);
    setSelectedInvoice(null);
    setEmailComposer(null);
    setProductPreview(null);
  };

  const changeAdminSection = (section) => {
    closeAdminTransientLayers();
    setActive(section);
  };

  const loadAdminData = useCallback(async ({ force = true } = {}) => {
    const {
      productData,
      orderData,
      userData,
      analyticsData,
      financeData,
      bulkData,
      bulkCustomerData,
      transactionData,
      invoiceData,
      paymentSettingsData,
      homepageData,
      bannerData,
      settingsData,
      salesData,
      featuredData,
    } = await fetchAdminDashboardData(expenseFilter, { force });

    if (!mountedRef.current) return;

    setProducts(Array.isArray(productData) ? productData : []);
    setOrders(Array.isArray(orderData) ? orderData : []);
    setCustomers(Array.isArray(userData) ? userData : []);
    setAnalytics(analyticsData);
    setFinance(financeData);
    setBulkOrders(bulkData || { summary: [], orders: [] });
    setBulkCustomers(Array.isArray(bulkCustomerData) ? bulkCustomerData : []);
    setTransactions(Array.isArray(transactionData) ? transactionData : []);
    setInvoices(invoiceData || { summary: [], invoices: [] });
    setSettings((prev) => ({ ...prev, ...settingsData, ...paymentSettingsData, merchantSecret: '' }));
    setHomepageContent(homepageData);
    setBanners(Array.isArray(bannerData) ? bannerData : []);
    setSaleCampaigns(Array.isArray(salesData) ? salesData : []);
    setFeaturedProducts(Array.isArray(featuredData) ? featuredData : []);
  }, [expenseFilter]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAdminData({ force: false }).catch((err) => {
      if (!cancelled) setError(getErrorMessage(err));
    });
    return () => {
      cancelled = true;
    };
  }, [loadAdminData]);

  useEffect(() => {
    const tables = document.querySelectorAll('.admin-table');
    tables.forEach((table) => {
      const headings = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
      table.querySelectorAll('tbody tr').forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (!cell.getAttribute('data-label') && headings[index]) {
            cell.setAttribute('data-label', headings[index]);
          }
        });
      });
    });
  }, [active, products, orders, customers, finance, bulkOrders, transactions, invoices, bulkCustomers, saleCampaigns, featuredProducts]);

  useEffect(() => {
    if (!message) return;
    if (/^(sending|loading|processing)/i.test(message)) {
      toast.warning(message);
    } else {
      toast.success(message);
    }
    setMessage('');
  }, [message, toast]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
    setError('');
  }, [error, toast]);

  useEffect(() => {
    if (!settingsDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [settingsDirty]);

  const totals = analytics?.totals || {
    users: customers.length,
    orders: orders.length,
    revenue: orders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0), 0),
    lowStock: products.filter((product) => getStockStatus(product).className === 'low').length,
  };

  const calculatedTotalStock = useMemo(
    () => SIZE_SET.reduce((sum, size) => sum + Number(productForm.sizeStock?.[size] || 0), 0),
    [productForm.sizeStock]
  );
  const selectedProductBadges = useMemo(() => new Set(splitCommaValues(productForm.badges)), [productForm.badges]);
  const selectedSaleProduct = useMemo(
    () => products.find((product) => (product.id || product._id) === saleForm.productId),
    [products, saleForm.productId]
  );
  const calculatedSaleDiscount = useMemo(() => {
    const original = Number(saleForm.originalPrice || 0);
    const sale = Number(saleForm.salePrice || 0);
    if (original <= 0 || sale < 0) return 0;
    return Math.max(0, Math.round(((original - sale) / original) * 100));
  }, [saleForm.originalPrice, saleForm.salePrice]);

  const expenseRecords = useMemo(() => finance?.expenseItems || [], [finance?.expenseItems]);

  const expenseSummaryCards = useMemo(() => {
    const total = expenseRecords.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const marketing = expenseRecords
      .filter((expense) => String(expense.category || '').toLowerCase() === 'marketing')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const operational = expenseRecords
      .filter((expense) => String(expense.category || '').toLowerCase() !== 'marketing')
      .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return [
      { label: 'Total Expenses', value: total || Number(finance?.expenses || 0), trend: 'down', note: `${expenseRecords.length} records` },
      { label: 'Marketing Expenses', value: marketing, trend: 'down', note: 'Campaign spend' },
      { label: 'Operational Expenses', value: operational, trend: 'down', note: 'Materials, shipping, other' },
    ];
  }, [expenseRecords, finance?.expenses]);

  const revenueTrend = finance?.monthlyRevenue || analytics?.salesOverTime || [];
  const weekdayNewCustomers = useMemo(() => normalizeWeekdaySeries(analytics?.newCustomers || [], 'customers'), [analytics?.newCustomers]);
  const weekdayReturningCustomers = useMemo(() => normalizeWeekdaySeries(analytics?.returningCustomers || [], 'customers'), [analytics?.returningCustomers]);
  const trafficSources = finance?.revenueSources || [];
  const collectionMix = finance?.revenueByCollection || [];
  const bestSellingSizes = useMemo(() => buildSizePerformance(orders), [orders]);
  const topCustomers = useMemo(() => buildTopCustomers(orders), [orders]);
  const bulkOrderRecords = bulkOrders?.orders || [];
  const bulkPipelineSummary = useMemo(() => {
    const totalBudget = bulkOrderRecords.reduce((sum, order) => sum + getBulkOrderValue(order), 0);

    return BULK_ORDER_STATUSES.map((status) => {
      const items = bulkOrderRecords.filter((order) => normalizeBulkStatus(order.status) === status);
      const revenue = items.reduce((sum, order) => sum + getBulkOrderValue(order), 0);
      return {
        ...getBulkStatusMeta(status),
        status,
        count: items.length,
        revenue,
        share: totalBudget ? Math.round((revenue / totalBudget) * 100) : 0,
      };
    });
  }, [bulkOrderRecords]);
  const bulkAverageOrderValue = useMemo(() => {
    const totalBudget = bulkOrderRecords.reduce((sum, order) => sum + getBulkOrderValue(order), 0);
    return bulkOrderRecords.length ? totalBudget / bulkOrderRecords.length : 0;
  }, [bulkOrderRecords]);
  const invoiceRecords = useMemo(() => invoices?.invoices || [], [invoices]);
  const filteredInvoices = useMemo(() => {
    const search = invoiceFilters.search.trim().toLowerCase();
    return invoiceRecords
      .filter((invoice) => {
        const matchesSearch = !search || [
          invoice.invoiceId,
          invoice.invoiceNumber,
          invoice.orderId,
          invoice.transactionId,
          invoice.customer,
          invoice.email,
        ].some((value) => String(value || '').toLowerCase().includes(search));
        const matchesStatus = invoiceFilters.status === 'all' || String(invoice.status || '').toLowerCase() === invoiceFilters.status;
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        const leftDate = new Date(left.date || left.issueDate || left.createdAt || 0).getTime();
        const rightDate = new Date(right.date || right.issueDate || right.createdAt || 0).getTime();
        return invoiceFilters.sort === 'asc' ? leftDate - rightDate : rightDate - leftDate;
      });
  }, [invoiceFilters.search, invoiceFilters.sort, invoiceFilters.status, invoiceRecords]);
  const invoiceTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / invoiceFilters.pageSize));
  const invoicePage = Math.min(invoiceFilters.page, invoiceTotalPages);
  const pagedInvoices = useMemo(() => {
    const start = (invoicePage - 1) * invoiceFilters.pageSize;
    return filteredInvoices.slice(start, start + invoiceFilters.pageSize);
  }, [filteredInvoices, invoiceFilters.pageSize, invoicePage]);
  const bulkMonthlyRevenue = useMemo(() => buildBulkMonthlyRevenue(bulkOrderRecords), [bulkOrderRecords]);
  const bulkStatusMix = useMemo(() => buildBulkStatusMix(bulkOrderRecords), [bulkOrderRecords]);
  const topWholesaleClients = useMemo(() => buildTopWholesaleClients(bulkOrderRecords), [bulkOrderRecords]);
  const topKpiCards = useMemo(() => {
    const pending = bulkOrderRecords.filter((o) => normalizeBulkStatus(o.status) === 'Pending').length;
    const approved = bulkOrderRecords.filter((o) => normalizeBulkStatus(o.status) === 'Approved').length;
    const production = bulkOrderRecords.filter((o) => normalizeBulkStatus(o.status) === 'Production').length;
    const completed = bulkOrderRecords.filter((o) => normalizeBulkStatus(o.status) === 'Completed').length;
    const cancelled = bulkOrderRecords.filter((o) => normalizeBulkStatus(o.status) === 'Cancelled').length;
    const totalRevenue = bulkOrderRecords.reduce((sum, o) => sum + getBulkOrderValue(o), 0);

    // map status->share from bulkPipelineSummary if available
    const shareMap = (bulkPipelineSummary || []).reduce((acc, s) => { acc[s.status] = s.share || 0; return acc; }, {});

    // revenue trend: compare last two months in bulkMonthlyRevenue
    let revenueTrend = 0;
    if ((bulkMonthlyRevenue || []).length >= 2) {
      const last = bulkMonthlyRevenue[bulkMonthlyRevenue.length - 1].revenue || 0;
      const prev = bulkMonthlyRevenue[bulkMonthlyRevenue.length - 2].revenue || 0;
      revenueTrend = prev ? Math.round(((last - prev) / Math.abs(prev)) * 100) : 0;
    }

    const make = (label, val, className, trend) => ({ label, value: val, className, trend });

    return [
      make('Pending Requests', pending, 'bulk-kpi-pending', shareMap['Pending'] || 0),
      make('Approved Orders', approved, 'bulk-kpi-approved', shareMap['Approved'] || 0),
      make('Production Orders', production, 'bulk-kpi-production', shareMap['Production'] || 0),
      make('Completed Orders', completed, 'bulk-kpi-completed', shareMap['Completed'] || 0),
      make('Cancelled Orders', cancelled, 'bulk-kpi-cancelled', shareMap['Cancelled'] || 0),
      make('Bulk Revenue', compactMoney(totalRevenue), 'bulk-kpi-revenue', revenueTrend),
    ];
  }, [bulkOrderRecords, bulkPipelineSummary, bulkMonthlyRevenue]);

  const showBulkStatusToast = (messages) => {
    const list = Array.isArray(messages) && messages.length ? messages : ['Status updated successfully'];
    list.slice(0, 3).forEach((item) => {
      const text = String(item || '').replace(/^\\?\s*/, '').trim();
      toast.success(text || 'Status updated successfully');
    });
  };

  const updateBulkOrderPipeline = async (orderId, status) => {
    setError('');
    setMessage('');
    try {
      const response = await api.put(`/bulk-orders/${orderId}/status`, { status });
      const updatedOrder = response.data.order || response.data;
      setBulkOrders((prev) => ({
        ...prev,
        orders: (prev.orders || []).map((order) => (order.id === orderId ? updatedOrder : order)),
      }));
      if ((selectedBulkOrder?.id || '') === orderId) {
        setSelectedBulkOrder(updatedOrder);
      }
      if (status === 'Approved') {
        const customersRes = await api.get('/bulk-orders/customers');
        setBulkCustomers(customersRes.data);
      }
      showBulkStatusToast((response.data.messages || []).map((item) => `? ${item}`));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteBulkOrder = async (orderId) => {
    const confirmed = window.confirm('Delete this bulk order request?');
    if (!confirmed) return;

    setError('');
    setMessage('');
    try {
      await api.delete(`/bulk-orders/${orderId}`);
      setBulkOrders((prev) => ({
        ...prev,
        orders: (prev.orders || []).filter((order) => order.id !== orderId),
      }));
      if ((selectedBulkOrder?.id || '') === orderId) {
        setSelectedBulkOrder(null);
      }
      const customersRes = await api.get('/bulk-orders/customers');
      setBulkCustomers(customersRes.data);
      showBulkStatusToast(['? Bulk order deleted']);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

    // Premium custom status selector component
    function StatusSelector({ order }) {
      const [open, setOpen] = useState(false);
      const current = normalizeBulkStatus(order.status);
      const statusMeta = getBulkStatusMeta(order.status);

      const toggle = (e) => { e.stopPropagation && e.stopPropagation(); setOpen((v) => !v); };
      const choose = async (e, s) => { e.stopPropagation && e.stopPropagation(); await updateBulkOrderPipeline(order.id, s); setOpen(false); };

      return (
        <div className="custom-status-selector" onClick={(e) => e.stopPropagation()}>
          <button type="button" className={`status-btn ${statusMeta.className}`} onClick={toggle} aria-haspopup="listbox" aria-expanded={open}>
            <span className="status-label">{current}</span>
            <span className="status-caret">▾</span>
          </button>
          {open && (
            <ul className="status-menu" role="listbox">
              {BULK_ORDER_STATUSES.map((s) => (
                <li key={s} role="option" aria-selected={s === current} className={`status-option ${s === current ? 'active' : ''}`} onClick={(e) => choose(e, s)}>
                  <span className="status-label">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

  const productReviews = parseReviewList(productForm.reviews);
  const productReviewStats = getReviewStats(productReviews);
  const productMetaKeywords = [productForm.name, productForm.category, 'Men'].filter(Boolean);
  const productPayload = {
    name: productForm.name,
    slug: productForm.slug || '',
    price: Number(productForm.price || 0),
    colors: splitCommaValues(productForm.colors),
    badges: PRODUCT_BADGE_OPTIONS.filter((badge) => selectedProductBadges.has(badge)),
    description: productForm.description,
    collection: 'men',
    category: productForm.category,
    subcategory: '',
    material: productForm.material,
    fabric: productForm.fabric,
    fit: productForm.fit,
    careInstructions: productForm.careInstructions,
    countryOfOrigin: productForm.countryOfOrigin || settings.countryOfOrigin || settings.defaultCountryOfOrigin || 'Sri Lanka',
    metaTitle: productForm.name,
    metaDescription: productForm.description,
    metaKeywords: productMetaKeywords,
    rating: productReviewStats.rating,
    reviewCount: productReviewStats.reviewCount,
    reviews: productReviews,
    stock: calculatedTotalStock,
    sizes: SIZE_SET,
    sizeStock: SIZE_SET.reduce((acc, size) => {
      acc[size] = Math.max(0, Math.trunc(Number(productForm.sizeStock?.[size] || 0)));
      return acc;
    }, {}),
    images: productForm.images.map((item) => String(item || '').trim()).filter(Boolean),
  };

  const updateImageAt = (index, value) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.map((image, imageIndex) => (imageIndex === index ? value : image)),
    }));
  };

  const addImageField = () => {
    setProductForm((prev) => ({ ...prev, images: [...prev.images, ''] }));
  };

  const removeImageField = (index) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const removePendingImageUpload = (index) => {
    setProductForm((prev) => {
      const upload = prev.imageUploads?.[index];
      if (upload?.preview) URL.revokeObjectURL(upload.preview);
      return {
        ...prev,
        imageUploads: (prev.imageUploads || []).filter((_, uploadIndex) => uploadIndex !== index),
      };
    });
  };

  const toggleProductBadge = (badge) => {
    setProductForm((prev) => {
      const nextBadges = new Set(splitCommaValues(prev.badges));
      if (nextBadges.has(badge)) {
        nextBadges.delete(badge);
      } else {
        nextBadges.add(badge);
      }
      return {
        ...prev,
        badges: PRODUCT_BADGE_OPTIONS.filter((option) => nextBadges.has(option)).join(', '),
      };
    });
  };

  const handleImageFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    const uploads = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setProductForm((prev) => ({ ...prev, imageUploads: [...(prev.imageUploads || []), ...uploads] }));
    event.target.value = '';
  };

  const buildProductFormData = () => {
    const formData = new FormData();
    Object.entries(productPayload).forEach(([key, value]) => {
      if (Array.isArray(value) || (value && typeof value === 'object')) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value ?? '');
      }
    });
    (productForm.imageUploads || []).forEach((upload) => {
      if (upload.file) formData.append('images', upload.file);
    });
    return formData;
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const formData = buildProductFormData();
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        setMessage('Product updated');
      } else {
        await api.post('/products', formData);
        setMessage('Product added');
      }
      (productForm.imageUploads || []).forEach((upload) => {
        if (upload.preview) URL.revokeObjectURL(upload.preview);
      });
      setProductForm(makeEmptyProduct());
      setEditingId(null);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editProduct = (product) => {
    changeAdminSection('Products');
    setEditingId(product.id || product._id);
    const incomingSizeStock = product.sizeStock || {};
    setProductForm({
      name: product.name || '',
      slug: product.slug || '',
      price: product.price || '',
      colors: (product.colors || []).join(', '),
      badges: (product.badges || []).filter((badge) => PRODUCT_BADGE_OPTIONS.includes(badge)).join(', '),
      description: product.description || '',
      collection: 'men',
      category: product.category || '',
      material: product.material || '',
      fabric: product.fabric || '',
      fit: product.fit || '',
      careInstructions: product.careInstructions || '',
      countryOfOrigin: product.countryOfOrigin || '',
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      metaKeywords: (product.metaKeywords || []).join(', '),
      rating: product.rating || '',
      reviewCount: product.reviewCount || '',
      reviews: JSON.stringify(product.reviews || [], null, 2),
      sizeStock: SIZE_SET.reduce((acc, size) => {
        acc[size] = Number(incomingSizeStock[size] || 0);
        return acc;
      }, newSizeStock()),
      images: product.images?.length ? product.images : [],
      imageUploads: [],
    });
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    await loadAdminData();
  };

  const duplicateProduct = async (product) => {
    const reviews = Array.isArray(product.reviews) ? product.reviews : [];
    const reviewStats = getReviewStats(reviews);
    const duplicatePayload = {
      name: product.name || '',
      price: Number(product.price || 0),
      colors: Array.isArray(product.colors) ? product.colors : [],
      badges: Array.isArray(product.badges) ? product.badges.filter((badge) => PRODUCT_BADGE_OPTIONS.includes(badge)) : [],
      description: product.description || '',
      collection: 'men',
      category: product.category || '',
      material: product.material || '',
      fabric: product.fabric || '',
      fit: product.fit || '',
      careInstructions: product.careInstructions || '',
      countryOfOrigin: product.countryOfOrigin || settings.countryOfOrigin || settings.defaultCountryOfOrigin || 'Sri Lanka',
      metaTitle: product.name || '',
      metaDescription: product.description || '',
      metaKeywords: [product.name, product.category, 'Men'].filter(Boolean),
      rating: reviewStats.rating,
      reviewCount: reviewStats.reviewCount,
      reviews,
      sizeStock: product.sizeStock || {},
      images: Array.isArray(product.images) ? product.images : [],
    };
    await api.post('/products', duplicatePayload);
    await loadAdminData();
  };

  const submitSaleCampaign = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const payload = {
      ...saleForm,
      originalPrice: Number(saleForm.originalPrice || 0),
      salePrice: Number(saleForm.salePrice || 0),
      discountPercentage: calculatedSaleDiscount,
    };
    try {
      if (editingSaleId) {
        await api.put(`/sales/${editingSaleId}`, payload);
        setMessage('Sale campaign updated');
      } else {
        await api.post('/sales', payload);
        setMessage('Sale campaign added');
      }
      setSaleForm(emptySaleForm());
      setEditingSaleId(null);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editSaleCampaign = (sale) => {
    changeAdminSection('Sales');
    setEditingSaleId(sale.id || sale._id);
    setSaleForm({
      productId: sale.productId || sale.product?.id || sale.product?._id || '',
      originalPrice: sale.originalPrice || '',
      salePrice: sale.salePrice || '',
      badge: sale.badge || 'Sale',
      startDate: toInputDate(sale.startDate),
      endDate: toInputDate(sale.endDate),
      isActive: Boolean(sale.isActive),
    });
  };

  const deleteSaleCampaign = async (id) => {
    setError('');
    setMessage('');
    try {
      await api.delete(`/sales/${id}`);
      if (editingSaleId === id) {
        setEditingSaleId(null);
        setSaleForm(emptySaleForm());
      }
      setMessage('Sale campaign removed');
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleSaleCampaign = async (sale) => {
    const id = sale.id || sale._id;
    try {
      await api.put(`/sales/${id}`, { ...sale, isActive: !sale.isActive });
      setMessage(sale.isActive ? 'Sale campaign deactivated' : 'Sale campaign activated');
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const submitFeaturedProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingFeaturedId) {
        await api.put(`/featured-products/${editingFeaturedId}`, featuredForm);
        setMessage('Featured product updated');
      } else {
        await api.post('/featured-products', featuredForm);
        setMessage('Featured product saved');
      }
      setFeaturedForm(emptyFeaturedForm());
      setEditingFeaturedId(null);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editFeaturedProduct = (featured) => {
    changeAdminSection('Marketing');
    setEditingFeaturedId(featured.id || featured._id);
    setFeaturedForm({
      productId: featured.productId || featured.product?.id || featured.product?._id || '',
      displayOrder: Number(featured.displayOrder || 0),
      isActive: Boolean(featured.isActive),
    });
  };

  const deleteFeaturedProduct = async (id) => {
    setError('');
    setMessage('');
    try {
      await api.delete(`/featured-products/${id}`);
      if (editingFeaturedId === id) {
        setEditingFeaturedId(null);
        setFeaturedForm(emptyFeaturedForm());
      }
      setMessage('Featured product removed');
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleFeaturedProduct = async (featured) => {
    const id = featured.id || featured._id;
    try {
      await api.put(`/featured-products/${id}`, { ...featured, isActive: !featured.isActive });
      setMessage(featured.isActive ? 'Featured product disabled' : 'Featured product enabled');
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await api.put(`/orders/${id}/status`, { status });
      setSelectedOrder(response.data);
      await loadAdminData();
      setMessage(`Order status updated to ${status}`);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteCustomer = async (id) => {
    await api.delete(`/users/${id}`);
    await loadAdminData();
  };

  const viewCustomerOrders = (customer) => {
    changeAdminSection('Orders');
    setOrderFilters((prev) => ({
      ...prev,
      orderId: '',
      customerName: '',
      email: customer.email || '',
      startDate: '',
      endDate: '',
      paymentStatus: 'all',
      orderStatus: 'all',
    }));
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingExpenseId) {
        await api.put(`/finance/expenses/${editingExpenseId}`, expenseForm);
        setMessage('Expense updated');
      } else {
        await api.post('/finance/expenses', expenseForm);
        setMessage('Expense added');
      }
      setExpenseForm(emptyExpense);
      setEditingExpenseId(null);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editExpense = (expense) => {
    setEditingExpenseId(expense.id || expense._id);
    setExpenseForm({
      title: expense.title || '',
      category: expense.category || 'Material cost',
      amount: expense.amount || '',
    });
  };

  const deleteExpense = async (id) => {
    setError('');
    setMessage('');
    try {
      await api.delete(`/finance/expenses/${id}`);
      if (editingExpenseId === id) {
        setEditingExpenseId(null);
        setExpenseForm(emptyExpense);
      }
      if ((selectedExpense?.id || selectedExpense?._id) === id) setSelectedExpense(null);
      setMessage('Expense deleted');
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const printInvoice = (order) => {
    const orderItems = Array.isArray(order.items) && order.items.length
      ? order.items
      : Array.isArray(order.products) && order.products.length
        ? order.products
        : [{ name: order.productName, quantity: order.quantity, price: order.price, size: order.size }];
    const lines = orderItems.map((item) => `${item.name} x ${item.quantity} - ${money(Number(item.price || 0) * Number(item.quantity || 1))}`).join('\n');
    const invoice = `ASTRAVIA INVOICE\n\nInvoice ID: ${order.invoiceId || order.invoiceNumber || '-'}\nOrder Reference: ${order.orderId || order._id || '-'}\nTransaction Reference: ${order.transactionId || order.payment?.reference || '-'}\n\nCustomer: ${order.customerName || order.customer || order.user?.name || order.address?.fullName || 'Customer'}\nEmail: ${order.customerEmail || order.email || order.user?.email || ''}\n\n${lines}\n\nShipping: ${money(order.shippingCost ?? order.shipping ?? 0)}\nTotal: ${money(order.totalAmount ?? order.totalPrice ?? order.grandTotal ?? order.amount)}`;
    const popup = window.open('', '_blank', 'width=720,height=900');
    popup.document.write(`<pre style="font-family:Arial;padding:32px;line-height:1.6">${invoice}</pre>`);
    popup.document.close();
    popup.print();
  };

  const downloadInvoicePdf = async (invoice) => {
    const invoiceKey = invoice.invoiceId || invoice.id || invoice._id;
    setInvoiceActionId(`download-${invoiceKey}`);
    try {
      const response = await api.get(`/invoices/download/${invoiceKey}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceId || invoice.invoiceNumber || 'invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('Invoice downloaded successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setInvoiceActionId('');
    }
  };

  const viewInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const openInvoiceEmailComposer = (invoice) => {
    setEmailComposer({
      invoice,
      to: invoice.email || invoice.customerEmail || '',
      subject: `Astravia Invoice - ${invoice.invoiceId || invoice.invoiceNumber || ''}`,
      message: buildInvoiceEmailMessage(invoice),
    });
    setError('');
    setMessage('');
  };

  const updateEmailComposer = (key, value) => {
    setEmailComposer((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  const submitInvoiceEmail = async () => {
    if (!emailComposer?.invoice) return;
    const invoice = emailComposer.invoice;
    const invoiceKey = invoice.invoiceId || invoice.id || invoice._id;
    setInvoiceActionId(`email-${invoiceKey}`);
    setError('');
    setMessage('Sending invoice email...');
    try {
      const response = await api.post(`/invoices/send-email/${invoiceKey}`, {
        to: emailComposer.to,
        subject: emailComposer.subject,
        message: emailComposer.message,
      });
      const successMessage = response.data?.message || 'Invoice emailed successfully.';
      setMessage(successMessage);
      setEmailComposer(null);
      await loadAdminData();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setMessage('');
      setError(errorMessage);
    } finally {
      setInvoiceActionId('');
    }
  };

  const whatsappUrl = (phone, text) =>
    `https://wa.me/${String(phone || settings.whatsappNumber || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;

  const messageCustomer = (order) => {
    const name = order.customerName || order.address?.fullName || order.user?.name || 'Customer';
    const phone = order.phone || order.address?.phone || settings.whatsappNumber;
    const reference = order.orderId || String(order._id || order.id || '').slice(-6);
    const text = `Hi ${name}, your order #${reference} is being processed.`;
    window.open(whatsappUrl(phone, text), '_blank', 'noopener,noreferrer');
  };

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSettingsDirty(true);
  };

  const saveSettingsSection = async (sectionId) => {
    if (sectionId === 'payment') {
      const response = await api.put('/settings/payment', settings);
      setSettings((prev) => ({ ...prev, ...response.data, merchantSecret: '' }));
    } else if (sectionId === 'site' || sectionId === 'general') {
      const response = await api.put('/settings', settings);
      setSettings((prev) => ({ ...prev, ...response.data }));
    }
    setSettingsDirty(false);
    setMessage('Settings saved successfully');
  };

  const handleSettingsSubmit = async (event, sectionId) => {
    event.preventDefault();
    await saveSettingsSection(sectionId);
  };

  const saveHomepage = async (event) => {
    event.preventDefault();
    const response = await api.put('/content/homepage', homepageContent);
    setHomepageContent(response.data);
    setMessage('Homepage content saved');
  };

  const uploadCmsImage = async (file, callback) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const response = await api.post('/content/upload', { image: reader.result });
      callback(response.data.url);
    };
    reader.readAsDataURL(file);
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    await api.post('/content/banners', bannerForm);
    setBannerForm({ title: '', imageUrl: '', link: '', isActive: true });
    await loadAdminData();
    setMessage('Banner saved');
  };

  const toggleBanner = async (banner) => {
    await api.put(`/content/banners/${banner._id}`, { ...banner, isActive: !banner.isActive });
    await loadAdminData();
  };

  const deleteBanner = async (id) => {
    await api.delete(`/content/banners/${id}`);
    await loadAdminData();
  };

  const loadPageContent = async (pageName) => {
    const response = await api.get(`/content/page/${pageName}`);
    setPageEditor({ pageName, content: response.data.content || '' });
  };

  const savePageContent = async (event) => {
    event.preventDefault();
    const response = await api.put(`/content/page/${pageEditor.pageName}`, { content: pageEditor.content });
    setPageEditor({ pageName: response.data.pageName, content: response.data.content || '' });
    setMessage('Page content saved');
  };

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) => {
      const category = String(product.category || '').toLowerCase();
      const collection = String(product.collection || '').toLowerCase();
      return (
        String(product.name || '').toLowerCase().includes(query) ||
        category.includes(query) ||
        collection.includes(query)
      );
    });
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = String(order.customerName || order.user?.name || order.address?.fullName || '').toLowerCase();
      const email = String(order.customerEmail || order.user?.email || '').toLowerCase();
      const orderId = String(order.orderId || order._id || '').toLowerCase();
      const paymentStatus = String(order.paymentStatus || order.payment?.status || '').toLowerCase();
      const status = String(order.orderStatus || order.status || '').toLowerCase();
      const createdAt = order.orderDate ? new Date(order.orderDate) : order.createdAt ? new Date(order.createdAt) : null;

      if (orderFilters.orderId && !orderId.includes(orderFilters.orderId.toLowerCase())) return false;
      if (orderFilters.customerName && !customerName.includes(orderFilters.customerName.toLowerCase())) return false;
      if (orderFilters.email && !email.includes(orderFilters.email.toLowerCase())) return false;
      if (orderFilters.paymentStatus !== 'all' && paymentStatus !== orderFilters.paymentStatus.toLowerCase()) return false;
      if (orderFilters.orderStatus !== 'all' && status !== orderFilters.orderStatus.toLowerCase()) return false;
      if (orderFilters.startDate && createdAt && createdAt < new Date(`${orderFilters.startDate}T00:00:00`)) return false;
      if (orderFilters.endDate && createdAt && createdAt > new Date(`${orderFilters.endDate}T23:59:59`)) return false;
      return true;
    });
  }, [orders, orderFilters]);

  const orderStats = useMemo(() => {
    const source = filteredOrders;
    const countBy = (value) => source.filter((order) => String(order.orderStatus || order.status || '').toLowerCase() === value).length;
    return {
      total: source.length,
      pending: countBy('pending'),
      processing: countBy('processing'),
      shipped: countBy('shipped'),
      delivered: countBy('delivered'),
      cancelled: countBy('cancelled'),
      revenue: source.reduce((sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0), 0),
    };
  }, [filteredOrders]);

  const customerRows = useMemo(() => {
    const now = new Date();
    const activeCutoff = new Date(now);
    activeCutoff.setDate(activeCutoff.getDate() - 90);

    const rows = customers.map((customer) => {
      const id = customer.id || customer._id;
      const email = customer.email || '';
      const role = customer.role || 'user';
      const customerId = customer.customerId || (role === 'admin' ? 'ADMIN-001' : 'CUS-000');

      const customerOrders = orders.filter((order) => {
        const orderUserId = order.userId || order.user?.id || order.user?._id || (typeof order.user === 'string' ? order.user : null);
        const orderEmail = order.customerEmail || order.user?.email || '';
        if (id && orderUserId && String(orderUserId) === String(id)) return true;
        if (email && orderEmail && String(orderEmail).toLowerCase() === String(email).toLowerCase()) return true;
        return false;
      });

      const deliveredOrders = customerOrders.filter((order) =>
        String(order.orderStatus || order.status || '').toLowerCase() === 'delivered'
      );
      const totalSpent = deliveredOrders.reduce((sum, order) => sum + Number(order.totalAmount ?? order.totalPrice ?? 0), 0);

      const lastOrderDate = customerOrders.reduce((latest, order) => {
        const date = order.orderDate ? new Date(order.orderDate) : order.createdAt ? new Date(order.createdAt) : null;
        if (!date) return latest;
        if (!latest || date > latest) return date;
        return latest;
      }, null);

      const isActive = Boolean(lastOrderDate && lastOrderDate >= activeCutoff);

      return {
        id,
        customerId,
        name: customer.name || 'Customer',
        email,
        role,
        isAdmin: role === 'admin',
        initials: getInitials(customer.name, email),
        totalOrders: customerOrders.length,
        totalSpent,
        deliveredOrdersCount: deliveredOrders.length,
        createdAt: customer.createdAt,
        isActive,
      };
    });

    return rows.sort((a, b) => {
      if (a.isAdmin && !b.isAdmin) return -1;
      if (!a.isAdmin && b.isAdmin) return 1;
      return String(a.customerId).localeCompare(String(b.customerId));
    });
  }, [customers, orders]);

  const customerMetrics = useMemo(() => {
    const nonAdmin = customerRows.filter((row) => !row.isAdmin);
    const totalCustomers = nonAdmin.length;
    const activeCustomers = nonAdmin.filter((row) => row.isActive).length;
    const totalRevenue = nonAdmin.reduce((sum, row) => sum + row.totalSpent, 0);
    const deliveredOrders = nonAdmin.reduce((sum, row) => sum + row.deliveredOrdersCount, 0);
    const averageOrderValue = deliveredOrders ? totalRevenue / deliveredOrders : 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomers = nonAdmin.filter((row) => row.createdAt && new Date(row.createdAt) >= startOfMonth).length;

    return {
      totalCustomers,
      activeCustomers,
      totalRevenue,
      averageOrderValue,
      newCustomers,
    };
  }, [customerRows]);

  const dashboardData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = startOfMonth;

    const orderDate = (order) => {
      const date = new Date(order.orderDate || order.createdAt || order.updatedAt || 0);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const orderAmount = (order) => Number(order.totalAmount ?? order.totalPrice ?? order.amount ?? 0);
    const orderStatus = (order) => String(order.orderStatus || order.status || '').toLowerCase();
    const isCompleted = (order) => ['delivered', 'completed'].includes(orderStatus(order));

    const revenueFor = (predicate) => orders.reduce((sum, order) => {
      const date = orderDate(order);
      return date && predicate(date, order) ? sum + orderAmount(order) : sum;
    }, 0);

    const todayOrders = orders.filter((order) => {
      const date = orderDate(order);
      return date && date >= startOfToday;
    });
    const monthOrders = orders.filter((order) => {
      const date = orderDate(order);
      return date && date >= startOfMonth;
    });
    const lastMonthOrders = orders.filter((order) => {
      const date = orderDate(order);
      return date && date >= lastMonthStart && date < thisMonthStart;
    });

    const totalRevenue = orders.reduce((sum, order) => sum + orderAmount(order), 0);
    const todayRevenue = revenueFor((date) => date >= startOfToday);
    const monthRevenue = revenueFor((date) => date >= startOfMonth);
    const yearRevenue = revenueFor((date) => date >= startOfYear);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + orderAmount(order), 0);
    const monthlyGrowth = lastMonthRevenue ? ((monthRevenue - lastMonthRevenue) / Math.abs(lastMonthRevenue)) * 100 : (monthRevenue ? 100 : 0);
    const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;

    const lowStockProducts = products
      .map((product) => ({
        id: product.id || product._id || product.name,
        name: product.name || 'Product',
        stock: getTotalStock(product),
      }))
      .filter((product) => product.stock > 0 && product.stock <= 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6);

    const productLookup = new Map(products.map((product) => [String(product.id || product._id), product]));
    const productSales = new Map();
    orders.forEach((order) => {
      const items = Array.isArray(order.items) && order.items.length ? order.items : [];
      items.forEach((item) => {
        const product = productLookup.get(String(item.product || item.productId || ''));
        const name = item.name || item.productName || product?.name || 'Product';
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || item.unitPrice || product?.price || 0);
        const existing = productSales.get(name) || { name, units: 0, revenue: 0 };
        existing.units += quantity;
        existing.revenue += quantity * price;
        productSales.set(name, existing);
      });
    });
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
      .slice(0, 5);

    const sortedOrders = [...orders].sort((a, b) => (orderDate(b)?.getTime() || 0) - (orderDate(a)?.getTime() || 0));
    const recentOrders = sortedOrders.slice(0, 5);

    const activity = [
      ...sortedOrders.slice(0, 2).map((order) => ({ type: 'New order received', label: order.orderId || order.id || order._id, date: orderDate(order) })),
      ...invoiceRecords.slice(0, 2).map((invoice) => ({ type: 'Invoice generated', label: invoice.invoiceId || invoice.invoiceNumber, date: new Date(invoice.date || invoice.issueDate || invoice.createdAt || 0) })),
      ...products.filter((product) => product.updatedAt).slice(0, 1).map((product) => ({ type: 'Product updated', label: product.name, date: new Date(product.updatedAt) })),
      ...customerRows.filter((customer) => customer.createdAt).slice(0, 1).map((customer) => ({ type: 'Customer registered', label: customer.name, date: new Date(customer.createdAt) })),
    ].filter((item) => item.date && !Number.isNaN(item.date.getTime()))
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    const rangeConfig = {
      '7d': { days: 7, label: '7 Days' },
      '30d': { days: 30, label: '30 Days' },
      '12m': { months: 12, label: '12 Months' },
    };
    const range = rangeConfig[dashboardRange] || rangeConfig['30d'];
    const revenueSeries = [];
    if (range.months) {
      for (let index = 0; index < range.months; index += 1) {
        const start = new Date(now.getFullYear(), index, 1);
        const end = new Date(now.getFullYear(), index + 1, 1);
        revenueSeries.push({
          label: start.toLocaleDateString('en-US', { month: 'short' }),
          revenue: revenueFor((date) => date >= start && date < end),
        });
      }
    } else {
      for (let index = range.days - 1; index >= 0; index -= 1) {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index + 1);
        revenueSeries.push({
          label: range.days <= 7 ? start.toLocaleDateString('en-US', { weekday: 'short' }) : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: revenueFor((date) => date >= start && date < end),
        });
      }
    }

    const returningCustomers = customerRows.filter((customer) => !customer.isAdmin && customer.totalOrders > 1).length;
    const totalCustomers = customerMetrics.totalCustomers || 0;
    const returningCustomerPercent = totalCustomers ? Math.round((returningCustomers / totalCustomers) * 100) : 0;

    return {
      topKpis: [
        { label: 'Total Orders', value: orders.length, trend: monthOrders.length >= lastMonthOrders.length ? 'up' : 'down', today: todayOrders.length, month: monthOrders.length },
        { label: 'Total Revenue', value: formatLkr(totalRevenue), trend: monthRevenue >= lastMonthRevenue ? 'up' : 'down', today: formatLkr(todayRevenue), month: formatLkr(monthRevenue) },
        { label: 'Total Customers', value: totalCustomers, trend: customerMetrics.newCustomers ? 'up' : 'neutral', today: customerRows.filter((customer) => customer.createdAt && new Date(customer.createdAt) >= startOfToday).length, month: customerMetrics.newCustomers },
        { label: 'Low Stock Alerts', value: lowStockProducts.length, trend: lowStockProducts.length ? 'warning' : 'up', today: lowStockProducts.length, month: `${lowStockProducts.length} products` },
      ],
      secondaryKpis: [
        { label: 'Pending Orders', value: orders.filter((order) => orderStatus(order) === 'pending').length },
        { label: 'Completed Orders', value: orders.filter(isCompleted).length },
        { label: 'Average Order Value', value: formatLkr(averageOrderValue) },
        { label: 'Monthly Growth %', value: `${monthlyGrowth.toFixed(1)}%`, trend: monthlyGrowth >= 0 ? 'up' : 'down' },
      ],
      revenueSeries,
      recentOrders,
      topProducts,
      lowStockProducts,
      activity,
      customerInsights: {
        totalCustomers,
        newThisMonth: customerMetrics.newCustomers,
        returningCustomerPercent,
      },
      performance: {
        todayRevenue,
        monthRevenue,
        yearRevenue,
      },
    };
  }, [customerMetrics.newCustomers, customerMetrics.totalCustomers, customerRows, dashboardRange, invoiceRecords, orders, products]);

  const statusClass = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'pending') return 'pending';
    if (value === 'processing') return 'processing';
    if (value === 'shipped') return 'shipped';
    if (value === 'delivered') return 'delivered';
    if (value === 'cancelled') return 'cancelled';
    return 'pending';
  };

  const paymentClass = (status) => {
    const value = String(status || '').toLowerCase();
    if (value === 'paid') return 'paid';
    if (value === 'refunded') return 'refunded';
    return 'pending';
  };

  const updatePaymentStatus = async (id, paymentStatus) => {
    try {
      const response = await api.put(`/orders/${id}/payment-status`, { paymentStatus });
      setSelectedOrder(response.data);
      await loadAdminData();
      setMessage(`Payment status updated to ${paymentStatus}`);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const orderTimeline = (order) => {
    const created = order.orderDate ? new Date(order.orderDate) : order.createdAt ? new Date(order.createdAt) : new Date();
    const updated = order.updatedAt ? new Date(order.updatedAt) : created;
    return [
      { label: 'Order Placed', time: created },
      { label: 'Payment Confirmed', time: String(order.paymentStatus || '').toLowerCase() === 'paid' ? created : null },
      { label: 'Processing', time: ['processing', 'shipped', 'delivered'].includes(String(order.orderStatus || order.status || '').toLowerCase()) ? updated : null },
      { label: 'Shipped', time: ['shipped', 'delivered'].includes(String(order.orderStatus || order.status || '').toLowerCase()) ? updated : null },
      { label: 'Delivered', time: String(order.orderStatus || order.status || '').toLowerCase() === 'delivered' ? updated : null },
    ];
  };

  const getProductImage = (item) => {
    const product = products.find((entry) => (entry.id || entry._id) === item.product);
    return resolveImageUrl(product?.images?.[0] || '');
  };

  const getSaleStatus = (sale) => {
    if (!sale.isActive) return 'Inactive';
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);
    if (start > now) return 'Scheduled';
    if (end < now) return 'Expired';
    return 'Active';
  };

  const renderDashboard = () => {
    const topProductMax = Math.max(...dashboardData.topProducts.map((item) => item.revenue), 1);

    return (
      <div className="luxury-dashboard">
        <div className="dashboard-kpi-grid primary">
          {dashboardData.topKpis.map((item) => (
            <article className={`dashboard-kpi-card ${item.trend || ''}`} key={item.label}>
              <div>
                <span>{item.label}</span>
                <i>{item.trend === 'down' ? 'Down' : item.trend === 'warning' ? 'Watch' : 'Up'}</i>
              </div>
              <strong>{item.value}</strong>
             
            </article>
          ))}
        </div>

             <div className="dashboard-kpi-grid secondary">
          {dashboardData.secondaryKpis.map((item) => (
            <article className={`dashboard-mini-kpi ${item.trend || ''}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        <section className="admin-panel luxury-dashboard-chart">
          <div className="admin-section-head">
            <span>Sales Analytics</span>
            <h2>Revenue Overview</h2>
          </div>
          <div className="dashboard-range-toggle" role="group" aria-label="Revenue range">
            {[
              ['7d', '7 Days'],
              ['30d', '30 Days'],
              ['12m', '12 Months'],
            ].map(([value, label]) => (
              <button key={value} type="button" className={dashboardRange === value ? 'active' : ''} onClick={() => setDashboardRange(value)}>
                {label}
              </button>
            ))}
          </div>
          <PremiumLineChart data={dashboardData.revenueSeries} valueKey="revenue" tone="revenue" />
        </section>

        <div className="dashboard-main-grid">
          <section className="admin-panel">
            <div className="admin-section-head"><span>Order Insights</span><h2>Recent Orders</h2></div>
            <DataTable
              columns={[
                { key: 'customer', label: 'Customer' },
                { key: 'orderId', label: 'Order ID' },
                { key: 'amount', label: 'Amount' },
                { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
                { key: 'date', label: 'Date' },
              ]}
              rows={dashboardData.recentOrders.map((order) => ({
                id: order.id || order._id || order.orderId,
                customer: order.customerName || order.user?.name || order.address?.fullName || 'Customer',
                orderId: order.orderId || String(order.id || order._id || '').slice(-8),
                amount: formatLkr(order.totalAmount ?? order.totalPrice ?? order.amount),
                status: order.orderStatus || order.status || 'Pending',
                date: formatDate(order.orderDate || order.createdAt),
              }))}
            />
          </section>

          <section className="admin-panel dashboard-side-card">
            <div className="admin-section-head"><span>Customers</span><h2>Customer Insights</h2></div>
            <div className="dashboard-insight-list">
              <p><span>Total Customers</span><strong>{dashboardData.customerInsights.totalCustomers}</strong></p>
              <p><span>New This Month</span><strong>{dashboardData.customerInsights.newThisMonth}</strong></p>
              <p><span>Returning Customers</span><strong>{dashboardData.customerInsights.returningCustomerPercent}%</strong></p>
            </div>
          </section>
        </div>

        <div className="dashboard-main-grid balanced">
          <section className="admin-panel">
            <div className="admin-section-head"><span>Top Products</span><h2>Best Performers</h2></div>
            <div className="dashboard-product-bars">
              {dashboardData.topProducts.length ? dashboardData.topProducts.map((item) => (
                <article key={item.name}>
                  <div><strong>{item.name}</strong><span>{item.units} units</span><em>{formatLkr(item.revenue)}</em></div>
                  <b><i style={{ width: `${Math.max(8, Math.round((item.revenue / topProductMax) * 100))}%` }} /></b>
                </article>
              )) : <p className="dashboard-empty">No product sales yet.</p>}
            </div>
          </section>

          <section className="admin-panel dashboard-side-card">
            <div className="admin-section-head"><span>Inventory</span><h2>Low Stock</h2></div>
            <div className="dashboard-stock-list">
              {dashboardData.lowStockProducts.length ? dashboardData.lowStockProducts.map((product) => (
                <p key={product.id} className={product.stock <= 5 ? 'critical' : ''}>
                  <span>{product.name}</span>
                  <strong>{product.stock} left</strong>
                </p>
              )) : <p className="dashboard-empty">No low stock products.</p>}
            </div>
          </section>
        </div>

        <div className="dashboard-main-grid balanced">
          <section className="admin-panel dashboard-side-card">
            <div className="admin-section-head"><span>Activity</span><h2>Recent Activity</h2></div>
            <div className="dashboard-activity">
              {dashboardData.activity.length ? dashboardData.activity.map((item, index) => (
                <p key={`${item.type}-${item.label}-${index}`}>
                  <i>?</i>
                  <span>{item.type}<em>{item.label || 'Astravia'}</em></span>
                  <time>{formatDate(item.date)}</time>
                </p>
              )) : <p className="dashboard-empty">No recent activity.</p>}
            </div>
          </section>

          <section className="admin-panel dashboard-side-card">
            <div className="admin-section-head"><span>Actions</span><h2>Quick Actions</h2></div>
            <div className="dashboard-actions">
              <button type="button" onClick={() => changeAdminSection('Products')}>+ Add Product</button>
              <button type="button" onClick={() => changeAdminSection('Orders')}>+ Create Order</button>
              <button type="button" onClick={() => changeAdminSection('Invoices')}>+ Generate Invoice</button>
              <button type="button" onClick={() => changeAdminSection('Analytics')}>View Reports</button>
            </div>
          </section>

          <section className="admin-panel dashboard-side-card performance">
            <div className="admin-section-head"><span>Performance</span><h2>Business Performance</h2></div>
            <div className="dashboard-insight-list">
              <p><span>Today's Revenue</span><strong>{formatLkr(dashboardData.performance.todayRevenue)}</strong></p>
              <p><span>This Month</span><strong>{formatLkr(dashboardData.performance.monthRevenue)}</strong></p>
              <p><span>This Year</span><strong>{formatLkr(dashboardData.performance.yearRevenue)}</strong></p>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderProducts = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Catalog Studio</span><h2>{editingId ? 'Edit Product' : 'Create Product'}</h2></div>
        <form className="admin-form admin-product-form" onSubmit={submitProduct}>
          <section className="admin-product-section">
            <div className="admin-product-section-title">
              <span>Basic Information</span>
              <h3></h3>
            </div>
            <div className="admin-product-grid two">
              <label>
                Collection
                <select
                  value={productForm.collection}
                  onChange={(event) => {
                    const collection = event.target.value;
                    const categories = getCategoryOptions(collection);
                    const nextCategory = categories[0] || '';
                    setProductForm((prev) => ({
                      ...prev,
                      collection,
                      category: nextCategory,
                    }));
                  }}
                >
                  {COLLECTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                Category
                <select
                  value={productForm.category}
                  onChange={(event) => {
                    const category = event.target.value;
                    setProductForm((prev) => ({
                      ...prev,
                      category,
                    }));
                  }}
                >
                  {(getCategoryOptions(productForm.collection) || []).map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <div className="admin-product-grid two">
              <label>Product Name<input name="name" value={productForm.name} onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
              <label>Price<input name="price" type="number" min="0" value={productForm.price} onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))} /></label>
            </div>
            <label className="admin-product-wide">
              Description
              <textarea name="description" value={productForm.description} onChange={(e) => setProductForm((prev) => ({ ...prev, description: e.target.value }))} />
            </label>
          </section>

          <section className="admin-product-section">
            <div className="admin-product-section-title">
              <span>Product Status</span>
              <h3></h3>
            </div>
            <div className="admin-product-badges">
              {PRODUCT_BADGE_OPTIONS.map((badge) => (
                <label className="admin-product-badge-check" key={badge}>
                  <input
                    type="checkbox"
                    checked={selectedProductBadges.has(badge)}
                    onChange={() => toggleProductBadge(badge)}
                  />
                  <span aria-hidden="true" />
                  {badge}
                </label>
              ))}
            </div>
          </section>

          <section className="admin-product-section">
            <div className="admin-product-section-title">
              <span>Colours</span>
              <h3></h3>
            </div>
            <label className="admin-product-wide">
              Colours
              <input
                name="colors"
                value={productForm.colors || ''}
                onChange={(e) => setProductForm((prev) => ({ ...prev, colors: e.target.value }))}
                placeholder="Ivory, Noir, Pearl"
              />
            </label>
          </section>

          <section className="admin-product-section">
            <div className="admin-image-manager admin-product-image-manager">
              <div className="admin-image-head">
                <span>Product Images</span>
                <div>
                  <button type="button" onClick={addImageField}>Image URL</button>
                  <label>
                    Image Upload
                    <input type="file" accept="image/*" multiple onChange={handleImageFiles} />
                  </label>
                </div>
              </div>
              <div className="admin-image-list">
                {productForm.images.length === 0 && !(productForm.imageUploads || []).length && <p>No product images added yet.</p>}
                {productForm.images.map((image, index) => (
                  <div className="admin-image-row" key={`${image}-${index}`}>
                    <div className="admin-image-preview">
                      {image ? <img src={resolveImageUrl(image)} alt={`Product ${index + 1}`} /> : <span>Image</span>}
                    </div>
                    <input
                      value={image}
                      onChange={(event) => updateImageAt(index, event.target.value)}
                      placeholder="https://example.com/product-image.jpg"
                    />
                    <button type="button" onClick={() => removeImageField(index)}>Remove</button>
                  </div>
                ))}
                {(productForm.imageUploads || []).map((upload, index) => (
                  <div className="admin-image-row" key={upload.id}>
                    <div className="admin-image-preview">
                      <img src={upload.preview} alt={`Pending upload ${index + 1}`} />
                    </div>
                    <input value={upload.file?.name || 'Pending upload'} readOnly />
                    <button type="button" onClick={() => removePendingImageUpload(index)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="admin-product-section">
            <div className="admin-size-stock-editor admin-product-stock-editor">
              <div className="admin-product-section-title">
                <span>Size Stock</span>
                <h3></h3>
              </div>
              <div>
                {SIZE_SET.map((size) => (
                  <label key={size}>
                    {size}
                    <input
                      type="number"
                      min="0"
                      value={productForm.sizeStock?.[size] ?? 0}
                      onChange={(event) => setProductForm((prev) => ({
                        ...prev,
                        sizeStock: {
                          ...prev.sizeStock,
                          [size]: Math.max(0, Math.trunc(Number(event.target.value || 0)))
                        }
                      }))}
                    />
                  </label>
                ))}
              </div>
              <p>Total Stock: <strong>{calculatedTotalStock}</strong></p>
            </div>
          </section>

          <details className="admin-product-accordion">
            <summary>Additional Product Details</summary>
            <div className="admin-product-grid two">
              <label>Material<input value={productForm.material} onChange={(e) => setProductForm((prev) => ({ ...prev, material: e.target.value }))} placeholder="Silk, linen, cotton" /></label>
              <label>Fabric<input value={productForm.fabric} onChange={(e) => setProductForm((prev) => ({ ...prev, fabric: e.target.value }))} placeholder="Heavyweight cotton jersey" /></label>
              <label>Fit<input value={productForm.fit} onChange={(e) => setProductForm((prev) => ({ ...prev, fit: e.target.value }))} placeholder="Oversized, relaxed, tailored" /></label>
              <label className="admin-product-wide">
                Care Instructions
                <textarea value={productForm.careInstructions} onChange={(e) => setProductForm((prev) => ({ ...prev, careInstructions: e.target.value }))} placeholder="Dry clean only. Store folded." />
              </label>
            </div>
          </details>
          <div className="admin-product-submit-row">
            <button className="admin-primary admin-primary-product" type="submit">{editingId ? 'Update Product' : 'Create Product'}</button>
          </div>
        </form>
      </section>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Product Management</span><h2>Product List</h2></div>
        <div className="admin-inline-search">
          <input
            placeholder="Search by product name, collection, or category"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
        </div>
        <div className="admin-table-wrap admin-products-table-wrap">
          <table className="admin-table admin-products-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Collection</th>
                <th>Category</th>
                <th>Stock Status</th>
                <th>Description</th>
                <th>Price</th>
                <th>Total Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={9}>No products found.</td>
                </tr>
              )}
              {filteredProducts.map((product) => {
                const id = product.id || product._id;
                const isExpanded = expandedProductId === id;
                return (
                  <Fragment key={id}>
                    <tr>
                      <td><div className="admin-mini-image">{product.images?.[0] ? <img src={resolveImageUrl(product.images[0])} alt={product.name} /> : <span>No Image</span>}</div></td>
                      <td>{product.name || '-'}</td>
                      <td>{getCollectionLabel(product.collection)}</td>
                      <td>{product.category || '-'}</td>
                      <td><span className={`admin-stock-pill ${getStockStatus(product).className}`}>{getStockStatus(product).label}</span></td>
                      <td className="admin-cell-clamp">{product.description || '-'}</td>
                      <td>{money(product.price)}</td>
                      <td>{getTotalStock(product)}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-action admin-action-open"
                            type="button"
                            onClick={() => setExpandedProductId((prev) => (prev === id ? '' : id))}
                          >
                            {isExpanded ? 'Hide' : 'Show'}
                          </button>
                          <button className="admin-action admin-action-message" type="button" onClick={() => editProduct(product)}>Edit</button>
                          <button className="admin-action admin-action-processing" type="button" onClick={() => duplicateProduct(product)}>Duplicate</button>
                          <button className="admin-action admin-action-cancelled" type="button" onClick={() => deleteProduct(id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${id}-details`} className="admin-product-expanded-row">
                        <td colSpan={9}>
                          <div className="admin-product-expanded-grid">
                            <div>
                              <h4>Full Description</h4>
                              <p>{product.description || 'No description provided.'}</p>
                            </div>
                            <div>
                              <h4>Metadata</h4>
                              <p><strong>Collection:</strong> {getCollectionLabel(product.collection)}</p>
                              <p><strong>Category:</strong> {product.category || '-'}</p>
                              <p><strong>Stock Status:</strong> {getStockStatus(product).label}</p>
                            </div>
                            <div>
                              <h4>Size Stock</h4>
                              <div className="admin-size-stock-readonly">
                                {SIZE_SET.map((size) => (
                                  <span key={`${id}-${size}`}><strong>{size}:</strong> {Number(product.sizeStock?.[size] || 0)}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      {productPreview && (
        <section className="admin-panel">
          <div className="admin-section-head"><span>Preview</span><h2>{productPreview.name}</h2></div>
          <div className="admin-product-preview">
            <div className="admin-product-preview-image">
              {productPreview.images?.[0] ? <img src={resolveImageUrl(productPreview.images[0])} alt={productPreview.name} /> : <span>No Image</span>}
            </div>
            <div>
              <p>{productPreview.description || 'No description provided.'}</p>
              <p>Collection: {getCollectionLabel(productPreview.collection)}</p>
              <p>Category: {productPreview.category || '-'}</p>
              <p>Stock Status: {getStockStatus(productPreview).label}</p>
                <p>Price: {money(productPreview.price)}</p>
              <p>Total Stock: {productPreview.stock}</p>
              <button onClick={() => setProductPreview(null)}>Close Preview</button>
            </div>
          </div>
        </section>
      )}
    </>
  );

  const renderSales = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Sales Studio</span><h2>{editingSaleId ? 'Edit Sale Campaign' : 'Add Sale Campaign'}</h2></div>
        <form className="admin-form compact admin-sales-form" onSubmit={submitSaleCampaign}>
          <label>
            Product
            <select
              value={saleForm.productId}
              onChange={(event) => {
                const product = products.find((entry) => (entry.id || entry._id) === event.target.value);
                setSaleForm((prev) => ({
                  ...prev,
                  productId: event.target.value,
                  originalPrice: prev.originalPrice || product?.price || '',
                }));
              }}
              required
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id || product._id} value={product.id || product._id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label>Original Price<input type="number" min="0" value={saleForm.originalPrice} onChange={(e) => setSaleForm((prev) => ({ ...prev, originalPrice: e.target.value }))} required /></label>
          <label>Sale Price<input type="number" min="0" value={saleForm.salePrice} onChange={(e) => setSaleForm((prev) => ({ ...prev, salePrice: e.target.value }))} required /></label>
          <label>Discount %<input type="number" value={calculatedSaleDiscount} readOnly /></label>
          <label>Sale Badge<input value={saleForm.badge} onChange={(e) => setSaleForm((prev) => ({ ...prev, badge: e.target.value }))} placeholder="30% OFF" /></label>
          <label>Start Date<input type="date" value={saleForm.startDate} onChange={(e) => setSaleForm((prev) => ({ ...prev, startDate: e.target.value }))} required /></label>
          <label>End Date<input type="date" value={saleForm.endDate} onChange={(e) => setSaleForm((prev) => ({ ...prev, endDate: e.target.value }))} required /></label>
          <label className="admin-check"><input type="checkbox" checked={saleForm.isActive} onChange={(e) => setSaleForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Active</label>
          {selectedSaleProduct && (
            <div className="admin-sale-preview">
              <div className="admin-mini-image">{selectedSaleProduct.images?.[0] ? <img src={resolveImageUrl(selectedSaleProduct.images[0])} alt={selectedSaleProduct.name} /> : <span>No Image</span>}</div>
              <div>
                <strong>{selectedSaleProduct.name}</strong>
                <span>{selectedSaleProduct.category || 'Uncategorized'}</span>
              </div>
            </div>
          )}
          <button className="admin-primary" type="submit">{editingSaleId ? 'Update Sale' : 'Add Sale Campaign'}</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-section-head"><span>Campaign Control</span><h2>Sales Campaigns</h2></div>
        <DataTable
          empty="No sale campaigns yet."
          columns={[
            { key: 'image', label: 'Product Image', render: (row) => <div className="admin-mini-image">{row.image ? <img src={resolveImageUrl(row.image)} alt={row.productName} /> : <span>No Image</span>}</div> },
            { key: 'productName', label: 'Product Name' },
            { key: 'originalPrice', label: 'Original Price' },
            { key: 'salePrice', label: 'Sale Price' },
            { key: 'discount', label: 'Discount %' },
            { key: 'badge', label: 'Sale Badge' },
            { key: 'category', label: 'Category' },
            { key: 'startDate', label: 'Start Date' },
            { key: 'endDate', label: 'End Date' },
            { key: 'status', label: 'Status', render: (row) => <span className={`admin-pill ${row.status.toLowerCase()}`}>{row.status}</span> },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => editSaleCampaign(row.raw)}>Edit</button><button onClick={() => toggleSaleCampaign(row.raw)}>{row.raw.isActive ? 'Deactivate' : 'Activate'}</button><button onClick={() => deleteSaleCampaign(row.id)}>Remove</button></div> },
          ]}
          rows={saleCampaigns.map((sale) => ({
            id: sale.id || sale._id,
            raw: sale,
            image: resolveImageUrl(sale.image || sale.product?.images?.[0] || ''),
            productName: sale.productName || sale.product?.name || '-',
            originalPrice: money(sale.originalPrice),
            salePrice: money(sale.salePrice),
            discount: `${Number(sale.discountPercentage || 0)}%`,
            badge: sale.badge || 'Sale',
            category: sale.category || sale.product?.category || '-',
            startDate: formatDate(sale.startDate),
            endDate: formatDate(sale.endDate),
            status: getSaleStatus(sale),
          }))}
        />
      </section>
    </>
  );

  const renderMarketing = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Marketing</span><h2>Featured Products</h2></div>
        <form className="admin-form compact admin-featured-form" onSubmit={submitFeaturedProduct}>
          <label>
            Product
            <select value={featuredForm.productId} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, productId: e.target.value }))} required>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id || product._id} value={product.id || product._id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label>Display Order<input type="number" min="0" value={featuredForm.displayOrder} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, displayOrder: e.target.value }))} /></label>
          <label className="admin-check"><input type="checkbox" checked={featuredForm.isActive} onChange={(e) => setFeaturedForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Featured On Home</label>
          <button className="admin-primary" type="submit">{editingFeaturedId ? 'Update Featured Product' : 'Save Featured Product'}</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-section-head"><span>Home Display</span><h2>Featured Product Order</h2></div>
        <DataTable
          empty="No featured products selected."
          columns={[
            { key: 'image', label: 'Image', render: (row) => <div className="admin-mini-image">{row.image ? <img src={resolveImageUrl(row.image)} alt={row.productName} /> : <span>No Image</span>}</div> },
            { key: 'productName', label: 'Product' },
            { key: 'category', label: 'Category' },
            { key: 'price', label: 'Price' },
            { key: 'displayOrder', label: 'Display Order' },
            { key: 'isActive', label: 'Enabled' },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => editFeaturedProduct(row.raw)}>Edit</button><button onClick={() => toggleFeaturedProduct(row.raw)}>{row.raw.isActive ? 'Disable' : 'Enable'}</button><button onClick={() => deleteFeaturedProduct(row.id)}>Remove</button></div> },
          ]}
          rows={featuredProducts.map((featured) => ({
            id: featured.id || featured._id,
            raw: featured,
            image: resolveImageUrl(featured.image || featured.product?.images?.[0] || ''),
            productName: featured.productName || featured.product?.name || '-',
            category: featured.category || featured.product?.category || '-',
            price: money(featured.price || featured.product?.price),
            displayOrder: featured.displayOrder,
            isActive: featured.isActive ? 'Yes' : 'No',
          }))}
        />
      </section>
    </>
  );

  const renderOrders = () => (
    <>
      <div className="admin-order-metrics">
        <MetricCard label="Total Orders" value={orderStats.total} />
        <MetricCard label="Pending Orders" value={orderStats.pending} />
        <MetricCard label="Processing Orders" value={orderStats.processing} />
        <MetricCard label="Shipped Orders" value={orderStats.shipped} />
        <MetricCard label="Delivered Orders" value={orderStats.delivered} />
        <MetricCard label="Cancelled Orders" value={orderStats.cancelled} />
        <MetricCard label="Total Revenue" value={money(orderStats.revenue)} />
      </div>

      <section className="admin-panel">
        <div className="admin-section-head"><span>Order Management</span><h2>Orders</h2></div>
        <div className="admin-order-filters">
          <input placeholder="Order ID" value={orderFilters.orderId} onChange={(e) => setOrderFilters((prev) => ({ ...prev, orderId: e.target.value }))} />
          <input placeholder="Customer Name" value={orderFilters.customerName} onChange={(e) => setOrderFilters((prev) => ({ ...prev, customerName: e.target.value }))} />
          <input placeholder="Email" value={orderFilters.email} onChange={(e) => setOrderFilters((prev) => ({ ...prev, email: e.target.value }))} />
          <input type="date" value={orderFilters.startDate} onChange={(e) => setOrderFilters((prev) => ({ ...prev, startDate: e.target.value }))} />
          <input type="date" value={orderFilters.endDate} onChange={(e) => setOrderFilters((prev) => ({ ...prev, endDate: e.target.value }))} />
          <select value={orderFilters.paymentStatus} onChange={(e) => setOrderFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}>
            <option value="all">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
          <select value={orderFilters.orderStatus} onChange={(e) => setOrderFilters((prev) => ({ ...prev, orderStatus: e.target.value }))}>
            <option value="all">All Order Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <DataTable
          columns={[
            { key: 'orderId', label: 'Order ID' },
            { key: 'customerName', label: 'Customer' },
            { key: 'productName', label: 'Product' },
            { key: 'totalAmount', label: 'Amount' },
            { key: 'status', label: 'Order Status', render: (row) => <span className={`admin-pill ${statusClass(row.status)}`}>{row.status.toUpperCase()}</span> },
            { key: 'paymentStatus', label: 'Payment Status', render: (row) => <span className={`admin-pill ${paymentClass(row.paymentStatus)}`}>{row.paymentStatus.toUpperCase()}</span> },
            { key: 'transactionId', label: 'Transaction ID' },
            { key: 'orderDate', label: 'Created Date' },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button className="admin-action admin-action-open" onClick={() => setSelectedOrder(row.raw)}>Open</button><button className="admin-action admin-action-message" onClick={() => messageCustomer(row.raw)}>Message</button></div> },
          ]}
          rows={filteredOrders.map((order) => ({
            id: order._id || order.id,
            raw: order,
            orderId: order.orderId || String(order._id || order.id).slice(-8).toUpperCase(),
            customerName: order.customerName || order.user?.name || order.address?.fullName || 'Customer',
            customerEmail: order.customerEmail || order.user?.email || '-',
            customerId: order.customerId || order.user?.customerId || '-',
            phone: <span className="order-phone-cell">{order.phone || order.address?.phone || '-'}</span>,
            productName: order.productName || (order.items?.[0]?.name ?? '-'),
            size: order.size || (order.items?.[0]?.size ?? 'One Size'),
            quantity: order.quantity ?? order.items?.reduce((sum, item) => sum + Number(item.quantity || 1), 0) ?? 0,
            price: money(order.price ?? order.items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0) ?? 0),
            shippingCost: money(order.shippingCost || 0),
            totalAmount: money(order.totalAmount ?? order.totalPrice),
            paymentMethod: order.paymentMethod || '-',
            paymentStatus: String(order.paymentStatus || order.payment?.status || 'pending').toLowerCase(),
            status: String(order.orderStatus || order.status || 'pending').toLowerCase(),
            transactionId: order.transactionId || '-',
            orderDate: order.orderDate ? new Date(order.orderDate).toLocaleDateString() : order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'
          }))}
        />
      </section>
      {selectedOrder && (
        <aside className="admin-order-drawer">
          <button className="admin-close" onClick={() => setSelectedOrder(null)}>Close</button>
          <h3>Order #{selectedOrder.orderId || String(selectedOrder._id || selectedOrder.id).slice(-8).toUpperCase()}</h3>
          <div className="admin-order-detail-grid">
            <section>
              <h4>Customer Information</h4>
              <p>Name: {selectedOrder.customerName || selectedOrder.user?.name || selectedOrder.address?.fullName || 'Customer'}</p>
              <p>Email: {selectedOrder.customerEmail || selectedOrder.user?.email || '-'}</p>
              <p>Phone: {selectedOrder.phone || selectedOrder.address?.phone || '-'}</p>
            </section>
            <section>
              <h4>Shipping Address</h4>
              <p>{selectedOrder.address?.line1 || '-'}</p>
              <p>{selectedOrder.address?.line2 || ''}</p>
              <p>{selectedOrder.address?.city || '-'}, {selectedOrder.address?.country || '-'}</p>
              <p>{selectedOrder.address?.postalCode || '-'}</p>
            </section>
          </div>
          <section>
            <h4>Ordered Products</h4>
            <div className="admin-order-item-list">
              {(selectedOrder.items?.length ? selectedOrder.items : [{ name: selectedOrder.productName, size: selectedOrder.size, quantity: selectedOrder.quantity, price: selectedOrder.price }]).map((item) => (
                <article key={`${item.name}-${item.size}-${item.quantity}`}>
                  <div className="admin-mini-image">
                    {getProductImage(item) ? <img src={getProductImage(item)} alt={item.name} /> : <span>No Image</span>}
                  </div>
                  <div>
                    <p>{item.name}</p>
                    <small>Size: {item.size} | Qty: {item.quantity} | {money(Number(item.price || 0))}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="admin-order-summary">
            <h4>Order Summary</h4>
            <p>Item Price: <strong>{money(selectedOrder.price ?? selectedOrder.totalAmount ?? selectedOrder.totalPrice)}</strong></p>
            <p>Shipping: <strong>{money(selectedOrder.shippingCost || 0)}</strong></p>
            <p>Total: <strong>{money(selectedOrder.totalAmount ?? selectedOrder.totalPrice)}</strong></p>
          </section>
          <section className="admin-order-summary">
            <h4>Payment Details</h4>
            <p>Payment Method: <strong>{selectedOrder.paymentMethod || selectedOrder.payment?.method || '-'}</strong></p>
            <p>Transaction ID: <strong>{selectedOrder.transactionId || selectedOrder.payment?.reference || '-'}</strong></p>
            <p>Payment Status: <strong>{String(selectedOrder.paymentStatus || selectedOrder.payment?.status || '-').toUpperCase()}</strong></p>
            <p>Order Date: <strong>{selectedOrder.orderDate ? new Date(selectedOrder.orderDate).toLocaleString() : selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</strong></p>
          </section>
          <section className="admin-order-actions">
            <h4>Admin Actions</h4>
            <div className="admin-actions">
              <button className="admin-action admin-action-processing" onClick={() => updateStatus(selectedOrder._id || selectedOrder.id, 'processing')}>Mark Processing</button>
              <button className="admin-action admin-action-shipped" onClick={() => updateStatus(selectedOrder._id || selectedOrder.id, 'shipped')}>Mark Shipped</button>
              <button className="admin-action admin-action-delivered" onClick={() => updateStatus(selectedOrder._id || selectedOrder.id, 'delivered')}>Mark Delivered</button>
              <button className="admin-action admin-action-cancelled" onClick={() => updateStatus(selectedOrder._id || selectedOrder.id, 'cancelled')}>Cancel Order</button>
              <button className="admin-action admin-action-refund" onClick={() => updatePaymentStatus(selectedOrder._id || selectedOrder.id, 'REFUNDED')}>Refund</button>
            </div>
          </section>
          <section className="admin-order-timeline">
            <h4>Timeline</h4>
            {orderTimeline(selectedOrder).map((point) => (
              <p key={point.label}>
                <span>{point.label}</span>
                <strong>{point.time ? new Date(point.time).toLocaleString() : 'Pending'}</strong>
              </p>
            ))}
          </section>
        </aside>
      )}
    </>
  );

  const renderCustomers = () => (
    <>
      <div className="customer-metrics">
        <MetricCard label="Total Customers" value={customerMetrics.totalCustomers} />
        <MetricCard label="Active Customers" value={customerMetrics.activeCustomers} />
        <MetricCard label="Customer Revenue" value={formatLkr(customerMetrics.totalRevenue)} />
        <MetricCard label="Avg Order Value" value={formatLkr(customerMetrics.averageOrderValue)} />
        <MetricCard label="New This Month" value={customerMetrics.newCustomers} />
      </div>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Customers</span><h2>Customer Management</h2></div>
        <div className="admin-table-wrap customer-table-wrap">
          <table className="admin-table customer-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Password</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customerRows.length === 0 ? (
                <tr><td colSpan={7}>No customers found.</td></tr>
              ) : customerRows.map((row) => (
                <tr key={row.id} className="customer-row">
                  <td><span className={`customer-id${row.isAdmin ? ' admin' : ''}`}>{row.customerId}</span></td>
                  <td>
                    <div className="customer-name-cell">
                      <div className="customer-avatar">{row.initials}</div>
                      <div>
                        <div className="customer-name">{row.name}</div>
                        <div className="customer-badges">
                          <span className={`customer-badge ${row.isAdmin ? 'protected' : row.isActive ? 'active' : 'inactive'}`}>
                            {row.isAdmin ? 'Protected' : row.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{row.email || '-'}</td>
                  <td><span className="customer-password" aria-label="Masked password" /></td>
                  <td>{row.totalOrders}</td>
                  <td>{formatLkr(row.totalSpent)}</td>
                  <td>
                    {row.isAdmin ? (
                      <span className="customer-badge protected">Protected</span>
                    ) : (
                      <div className="admin-actions">
                        <button className="admin-action admin-action-view" onClick={() => setSelectedCustomer(row)}>View Profile</button>
                        <button className="admin-action admin-action-orders" onClick={() => viewCustomerOrders(row)}>View Orders</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedCustomer && (
          <div className="admin-detail">
            <button className="admin-close" onClick={() => setSelectedCustomer(null)}>Close</button>
            <h3>{selectedCustomer.name}</h3>
            <p>{selectedCustomer.email}</p>
            <p>{selectedCustomer.totalOrders} orders - {formatLkr(selectedCustomer.totalSpent)}</p>
          </div>
        )}
      </section>
    </>
  );

  const renderInventory = () => (
    <InventoryManagementPanel
      products={products}
      onRefreshData={loadAdminData}
      currency={settings.currency || 'LKR'}
    />
  );

  const renderFinance = () => (
    <div className="erp-page">
      <div className="erp-metrics">{(finance?.summary || []).map((item) => <PremiumMetricCard key={item.label} item={item} />)}</div>
      <section className="finance-section">
        <div className="admin-section-head"><span>Cash Flow</span><h2>Cash Flow Summary</h2></div>
        <div className="finance-cash-grid">{(finance?.cashFlow || []).map((item) => <PremiumMetricCard key={item.label} item={item} />)}</div>
      </section>
      <section className="finance-section">
        <div className="admin-section-head"><span>Expense Overview</span><h2>Expense Summary</h2></div>
        <div className="finance-expense-summary">{expenseSummaryCards.map((item) => <PremiumMetricCard key={item.label} item={item} />)}</div>
      </section>
      <div className="finance-operations-grid">
        <section className="erp-card finance-expense-card">
          <div className="admin-section-head"><span>Expense Management</span><h2>{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h2></div>
          <form className="finance-expense-form" onSubmit={submitExpense}>
            <label>Expense Title<input value={expenseForm.title} placeholder="e.g. Silk supplier balance" onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
            <label>Category<select value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}><option>Material cost</option><option>Shipping cost</option><option>Marketing</option><option>Other</option></select></label>
            <label>Amount<input type="number" min="0" step="0.01" value={expenseForm.amount} placeholder="0.00" onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} /></label>
            <div className="admin-actions finance-expense-actions">
              <button className="admin-primary finance-expense-submit" type="submit">{editingExpenseId ? 'Update Expense' : 'Save Expense'}</button>
              {editingExpenseId && <button className="admin-action admin-action-message" type="button" onClick={() => { setEditingExpenseId(null); setExpenseForm(emptyExpense); }}>Cancel</button>}
            </div>
          </form>
        </section>
      </div>
      <section className="erp-card finance-records-card">
        <div className="admin-section-head"><span>Expense Ledger</span><h2>Expense Records</h2></div>
        <DataTable
          columns={[
            { key: 'expenseName', label: 'Expense Name' },
            { key: 'category', label: 'Category' },
            { key: 'amount', label: 'Amount' },
            { key: 'dateAdded', label: 'Date Added' },
            {
              key: 'actions',
              label: 'Actions',
              render: (row) => (
                <div className="admin-actions finance-record-actions">
                  <button className="admin-action admin-action-open" type="button" onClick={() => setSelectedExpense(row.raw)}>View</button>
                  <button className="admin-action admin-action-message" type="button" onClick={() => editExpense(row.raw)}>Edit</button>
                  <button className="admin-action admin-action-cancelled" type="button" onClick={() => deleteExpense(row.id)}>Delete</button>
                </div>
              ),
            },
          ]}
          rows={expenseRecords.map((expense) => ({
            id: expense.id || expense._id,
            raw: expense,
            expenseName: expense.title,
            category: expense.category,
            amount: money(expense.amount),
            dateAdded: formatDate(expense.date || expense.createdAt),
          }))}
        />
      </section>
      <section className="erp-card"><div className="admin-section-head"><span>Performance</span><h2>Best Revenue Products</h2></div><DataTable columns={[{ key: 'product', label: 'Product' }, { key: 'orders', label: 'Orders' }, { key: 'revenue', label: 'Revenue' }, { key: 'profit', label: 'Profit' }]} rows={(finance?.bestProducts || []).map((item) => ({ id: item.product, ...item, revenue: money(item.revenue), profit: money(item.profit) }))} /></section>
      <section className="erp-card"><div className="admin-section-head"><span>Ledger</span><h2>Recent Transactions</h2></div><DataTable columns={[{ key: 'transactionId', label: 'Transaction ID' }, { key: 'customer', label: 'Customer' }, { key: 'amount', label: 'Amount' }, { key: 'paymentStatus', label: 'Payment Status', render: (row) => <StatusPill status={row.paymentStatus} /> }, { key: 'date', label: 'Date' }]} rows={(finance?.recentTransactions || []).map((item) => ({ id: item.transactionId || item.id, ...item, amount: money(item.amount), date: formatDate(item.date || item.createdAt) }))} /></section>
      <section className="finance-analytics-section">
        <div className="admin-section-head"><span></span><h2>Executive Analytics</h2></div>
        <div className="finance-chart-suite">
          <section className="erp-card glass finance-chart-card finance-line-card"><div className="admin-section-head"><span>Revenue Analytics</span><h2>Monthly Revenue</h2></div><PremiumLineChart data={finance?.monthlyRevenue || []} valueKey="revenue" tone="revenue" /></section>
          <section className="erp-card glass finance-chart-card finance-line-card"><div className="admin-section-head"><span>Profit Analytics</span><h2>Monthly Profit</h2></div><PremiumLineChart data={finance?.monthlyProfit || []} valueKey="profit" tone="profit" /></section>
          <section className="erp-card finance-chart-card"><div className="admin-section-head"><span>Collections</span><h2>Revenue by Collection</h2></div><PremiumDonutChart data={finance?.revenueByCollection || []} /></section>
          <section className="erp-card finance-chart-card"><div className="admin-section-head"><span>Revenue Mix</span><h2>Revenue Sources</h2></div><PremiumDonutChart data={finance?.revenueSources || []} /></section>
        </div>
      </section>
      {selectedExpense && (
        <aside className="erp-drawer finance-expense-drawer">
          <button className="admin-close" type="button" onClick={() => setSelectedExpense(null)}>Close</button>
          <div className="admin-section-head"><span>Expense Record</span><h2>{selectedExpense.title}</h2></div>
          <div className="erp-detail-grid">
            <span>Category<strong>{selectedExpense.category}</strong></span>
            <span>Amount<strong>{money(selectedExpense.amount)}</strong></span>
            <span>Date Added<strong>{formatDate(selectedExpense.date || selectedExpense.createdAt)}</strong></span>
            <span>Reference<strong>{selectedExpense.id || selectedExpense._id}</strong></span>
          </div>
          <div className="admin-actions">
            <button className="admin-action admin-action-message" type="button" onClick={() => editExpense(selectedExpense)}>Edit</button>
            <button className="admin-action admin-action-cancelled" type="button" onClick={() => deleteExpense(selectedExpense.id || selectedExpense._id)}>Delete</button>
          </div>
        </aside>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="erp-page analytics-dashboard">
      <div className="erp-metrics">{(analytics?.kpis || []).map((item) => <PremiumMetricCard key={item.label} item={item} />)}</div>

      <section className="erp-card glass analytics-hero-card">
        <div className="admin-section-head">
          <span>Revenue Intelligence</span>
          <h2>Revenue Trend</h2>
        </div>
        <div className="analytics-hero-meta">
          <article><span>Current Revenue</span><strong>{compactMoney(finance?.monthlyTarget?.currentRevenue || totals.revenue)}</strong></article>
          <article><span>Goal</span><strong>{compactMoney(finance?.monthlyTarget?.revenueGoal || totals.revenue)}</strong></article>
          <article><span>Completion</span><strong>{Number(finance?.monthlyTarget?.completion || 0).toFixed(0)}%</strong></article>
        </div>
        <PremiumLineChart data={revenueTrend} valueKey="revenue" tone="revenue" />
      </section>

      <div className="analytics-duo-grid">
        <section className="erp-card glass analytics-chart-card">
          <div className="admin-section-head"><span>Customer Growth</span><h2>New Customers</h2></div>
          <PremiumLineChart data={weekdayNewCustomers} valueKey="customers" tone="revenue" />
        </section>
        <section className="erp-card glass analytics-chart-card">
          <div className="admin-section-head"><span>Loyalty</span><h2>Returning Customers</h2></div>
          <PremiumLineChart data={weekdayReturningCustomers} valueKey="customers" tone="profit" />
        </section>
      </div>

      <div className="analytics-duo-grid">
        <section className="erp-card analytics-chart-card">
          <div className="admin-section-head"><span>Acquisition</span><h2>Traffic Sources</h2></div>
          <PremiumDonutChart data={trafficSources} />
        </section>
        <section className="erp-card analytics-chart-card">
          <div className="admin-section-head"><span>Collections</span><h2>Sales by Collection</h2></div>
          <PremiumDonutChart data={collectionMix} />
        </section>
      </div>

      <div className="analytics-duo-grid">
        <section className="erp-card analytics-chart-card">
          <div className="admin-section-head"><span>Merchandise</span><h2>Best Selling Sizes</h2></div>
          <PremiumHorizontalBarChart data={bestSellingSizes} valueKey="value" labelKey="label" />
        </section>
        <section className="erp-card analytics-weekday-card">
          <div className="admin-section-head"><span>Sales Rhythm</span><h2>Weekday Activity</h2></div>
          <div className="erp-heatmap">{(analytics?.heatmap || []).map((day) => <div key={day.label} title={`${day.label}: ${day.value} activity score`} style={{ '--heat': day.value / 140 }}><strong>{day.value}</strong><span>{day.label}</span></div>)}</div>
        </section>
      </div>

      <section className="erp-card analytics-table-card">
        <div className="admin-section-head"><span>Retention</span><h2>Top Customers</h2></div>
        <DataTable
          columns={[
            {
              key: 'customer',
              label: 'Customer',
              render: (row) => (
                <div className="analytics-customer-cell">
                  <span className="analytics-customer-avatar">{row.initials}</span>
                  <div>
                    <strong>{row.name}</strong>
                    <p>{row.email || 'No email on file'}</p>
                  </div>
                </div>
              ),
            },
            { key: 'orders', label: 'Orders' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'avgOrder', label: 'Avg. Order' },
            { key: 'lastOrder', label: 'Last Order' },
          ]}
          rows={topCustomers.map((customer) => ({
            id: customer.id,
            ...customer,
            revenue: compactMoney(customer.revenue),
            avgOrder: compactMoney(customer.avgOrder),
            lastOrder: formatDate(customer.lastOrder),
          }))}
          empty="No customer orders yet."
        />
      </section>

      <section className="erp-card">
        <div className="admin-section-head"><span>Products</span><h2>Top Performing Products</h2></div>
        <div className="erp-product-cards">{(analytics?.topProducts || []).map((item) => <article key={item.name} title={`${item.name}: ${item.conversion}% conversion`}><h3>{item.name}</h3><p>{item.views.toLocaleString()} views</p><strong>{item.sales} sales</strong><span>{item.conversion}% conversion</span></article>)}</div>
      </section>

      <section className="erp-card insight-panel">
        <div className="admin-section-head"><span>Insights</span><h2>Executive Notes</h2></div>
        <div className="insight-card-grid">{Object.entries(analytics?.insights || {}).map(([key, value]) => <article key={key}><span>{key.replace(/([A-Z])/g, ' $1')}</span><strong>{value}</strong></article>)}</div>
      </section>
    </div>
  );

  const renderBulkOrders = () => (
    <div className="erp-page bulk-dashboard">
      
        
        <div className="bulk-hero-grid">
          <div>
            <div className="top-kpi-grid">
              {topKpiCards.map((card) => (
                <article key={card.label} className={`premium-metric-card bulk-kpi-card ${card.className}`}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  {typeof card.trend !== 'undefined' && (
                    <small className={`bulk-kpi-trend ${card.trend >= 0 ? 'up' : 'down'}`}>{card.trend >= 0 ? 'Up' : 'Down'} {Math.abs(card.trend)}%</small>
                  )}
                </article>
              ))}
            </div>
            {/* pipeline badges removed per design — kept data and charts elsewhere */}
          </div>
        </div>
      

      <section className="erp-card bulk-orders-table-card">
        <div className="admin-section-head">
          <span></span>
          <h2>Bulk Orders</h2>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table erp-click-table bulk-orders-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Quantity</th>
                <th>Order Value</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bulkOrderRecords.map((order) => {
                const email = order.email || '-';
                return (
                  <tr key={order.id} onClick={() => setSelectedBulkOrder(order)}>
                    <td>
                      <div className="bulk-client-cell">
                        <span className="bulk-client-avatar">{getInitials(getBulkCompany(order), order.email)}</span>
                        <div>
                          <strong>{getBulkCompany(order)}</strong>
                          <p>{getBulkProducts(order).join(' · ') || 'Custom wholesale order'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{order.contactPerson}</strong>
                    </td>
                    <td className="bulk-email-cell" title={email}>
                      <span className="bulk-email-text">{email}</span>
                    </td>
                    <td>{order.phone || '-'}</td>
                    <td>{order.quantity}</td>
                    <td>{money(getBulkOrderValue(order))}</td>
                    <td>
                      <StatusSelector order={order} />
                    </td>
                    <td>{formatDate(getBulkDate(order))}</td>
                    <td>
                      <div className="bulk-row-actions">
                        <button className="admin-action admin-action-open" type="button" title="View details" onClick={(event) => { event.stopPropagation(); setSelectedBulkOrder(order); }}>
                          View Details
                        </button>
                        <button className="admin-action bulk-action-delete" type="button" title="Delete request" onClick={(event) => { event.stopPropagation(); deleteBulkOrder(order.id); }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="erp-card bulk-table-card">
        <div className="admin-section-head"><span>Wholesale CRM</span><h2>Bulk Customer Records</h2></div>
        <DataTable
          columns={[
            { key: 'company', label: 'Company' },
            { key: 'contactPerson', label: 'Contact Person' },
            {
              key: 'email',
              label: 'Email',
              className: 'bulk-data-email',
              render: (row) => <span className="bulk-email-text" title={row.email}>{row.email}</span>,
            },
            { key: 'phone', label: 'Phone' },
            { key: 'orders', label: 'Orders' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'lastOrder', label: 'Last Order' },
            { key: 'actions', label: 'Actions', render: (row) => (
              <div className="admin-actions">
                <button className="admin-action admin-action-open" onClick={() => setSelectedBulkCustomer(row)}>View</button>
              </div>
            ) },
          ]}
          rows={buildBulkCustomerRecords(bulkCustomers || []).map((customer) => ({
            id: customer.id || `${customer.email}-${customer.company}`,
            company: customer.company,
            contactPerson: customer.contactPerson,
            email: customer.email,
            phone: customer.phone,
            orders: customer.orders,
            revenue: compactMoney(customer.revenue),
            lastOrder: formatDate(customer.lastOrder),
            notes: customer.notes || '',
          }))}
          empty="No wholesale customer records yet."
        />
      </section>

      {selectedBulkCustomer && (
        <aside
          className="erp-drawer bulk-customer-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-customer-title"
          aria-describedby="bulk-customer-description"
          onKeyDown={(e) => { if (e.key === 'Escape') setSelectedBulkCustomer(null); }}
        >
          <button className="admin-close" onClick={() => setSelectedBulkCustomer(null)}>Close</button>
          <h3 id="bulk-customer-title">{selectedBulkCustomer.company}</h3>
          <span id="bulk-customer-description" className="sr-only">{selectedBulkCustomer.email}</span>
          <p>{selectedBulkCustomer.company} · {selectedBulkCustomer.email}</p>
          <div className="erp-detail-grid">
            <span>Phone<strong>{selectedBulkCustomer.phone}</strong></span>
            <span>Orders<strong>{selectedBulkCustomer.orders}</strong></span>
            <span>Revenue<strong>{selectedBulkCustomer.revenue}</strong></span>
            <span>Last Order<strong>{selectedBulkCustomer.lastOrder}</strong></span>
          </div>
          <h4>Notes</h4>
          <p>{selectedBulkCustomer.notes || 'No notes available.'}</p>
        </aside>
      )}

      <section className="finance-analytics-section">
        <div className="admin-section-head">
          <span>Wholesale Analytics</span>
          
        </div>
        <div className="finance-chart-suite bulk-chart-suite">
          <section className="erp-card glass finance-chart-card finance-line-card bulk-chart-card">
            <div className="admin-section-head"><span>Revenue Analytics</span><h2>Monthly Bulk Revenue</h2></div>
            <PremiumLineChart data={bulkMonthlyRevenue} valueKey="revenue" tone="revenue" />
          </section>
          <section className="erp-card finance-chart-card bulk-chart-card">
            <div className="admin-section-head"><span>Order Pipeline</span><h2>Orders by Status</h2></div>
            <PremiumDonutChart data={bulkStatusMix} />
          </section>
        </div>
      </section>

      

      <section className="erp-card bulk-table-card">
        <div className="admin-section-head"><span>Key Accounts</span><h2>Top Wholesale Clients</h2></div>
        <DataTable
          columns={[
            {
              key: 'company',
              label: 'Client',
              render: (row) => (
                <div className="analytics-customer-cell bulk-client-cell">
                  <span className="bulk-client-avatar">{row.initials}</span>
                  <div>
                    <strong>{row.company}</strong>
                    <p>{row.contactPerson}</p>
                  </div>
                </div>
              ),
            },
            { key: 'orders', label: 'Orders' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'avgOrder', label: 'Avg. Order' },
            { key: 'lastOrder', label: 'Last Order' },
          ]}
          rows={topWholesaleClients.map((client) => ({
            id: client.id,
            ...client,
            revenue: compactMoney(client.revenue),
            avgOrder: compactMoney(client.avgOrder),
            lastOrder: formatDate(client.lastOrder),
          }))}
          empty="No wholesale clients yet."
        />
      </section>

      {selectedBulkOrder && (
        <aside className="erp-drawer bulk-drawer">
          <button className="admin-close" onClick={() => setSelectedBulkOrder(null)}>Close</button>
          <h3>{getBulkCompany(selectedBulkOrder)}</h3>
          <p>{selectedBulkOrder.contactPerson} · {selectedBulkOrder.email}</p>
          <div className="erp-detail-grid">
            <span>Phone<strong>{selectedBulkOrder.phone}</strong></span>
            <span>Email<strong>{selectedBulkOrder.email}</strong></span>
            <span>Quantity<strong>{selectedBulkOrder.quantity}</strong></span>
            <span>Order Value<strong>{money(getBulkOrderValue(selectedBulkOrder))}</strong></span>
            <span>Created Date<strong>{formatDate(getBulkDate(selectedBulkOrder))}</strong></span>
            <span>Status<strong>{normalizeBulkStatus(selectedBulkOrder.status)}</strong></span>
          </div>
          <div className="bulk-drawer-status">
            <span>Pipeline Status</span>
            <StatusSelector order={selectedBulkOrder} />
          </div>
          <h4>Products</h4>
          <p>{getBulkProducts(selectedBulkOrder).join(', ') || 'No products supplied.'}</p>
          <h4>Message</h4>
          <p>{selectedBulkOrder.message || selectedBulkOrder.notes || 'No message supplied.'}</p>
        </aside>
      )}
    </div>
  );

  const renderTransactions = () => (
    <div className="erp-page">
      <section className="erp-card">
        <div className="admin-section-head"><span>Payments</span><h2>Transactions</h2></div>
        <DataTable
          columns={[
            { key: 'transactionId', label: 'Transaction ID' },
            { key: 'orderId', label: 'Order ID' },
            { key: 'customer', label: 'Customer' },
            { key: 'amount', label: 'Amount' },
            { key: 'paymentMethod', label: 'Payment Method' },
            { key: 'paymentStatus', label: 'Payment Status', render: (row) => <StatusPill status={row.paymentStatus} /> },
            { key: 'date', label: 'Date' },
          ]}
          rows={(transactions || []).map((transaction) => ({
            id: transaction.id || transaction._id || transaction.transactionId,
            transactionId: transaction.transactionId,
            orderId: transaction.orderId,
            customer: transaction.customer,
            amount: money(transaction.amount),
            paymentMethod: transaction.paymentMethod,
            paymentStatus: transaction.paymentStatus,
            date: formatDate(transaction.date || transaction.createdAt),
          }))}
          empty="No transactions yet."
        />
      </section>
    </div>
  );

  const renderInvoices = () => {
    const setInvoiceFilter = (key, value) => {
      setInvoiceFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };
    const invoiceSummary = invoices.summary || [];
    const start = filteredInvoices.length ? (invoicePage - 1) * invoiceFilters.pageSize + 1 : 0;
    const end = Math.min(invoicePage * invoiceFilters.pageSize, filteredInvoices.length);

    return (
      <div className="erp-page invoice-management-page">
        <div className="erp-metrics invoice-metrics">
          {invoiceSummary.map((item) => <PremiumMetricCard key={item.label} item={item} />)}
        </div>

        <section className="erp-card invoice-console">
          <div className="admin-section-head invoice-head">
            <div>
              <span>Documents</span>
              <h2>Invoice Management</h2>
            </div>
            <p>{filteredInvoices.length} invoices in view</p>
          </div>

          <div className="invoice-toolbar">
            <label className="invoice-search">
              <FaSearch aria-hidden="true" />
              <input
                value={invoiceFilters.search}
                placeholder="Search invoice, order, transaction, customer"
                onChange={(event) => setInvoiceFilter('search', event.target.value)}
              />
            </label>
            <select value={invoiceFilters.status} onChange={(event) => setInvoiceFilter('status', event.target.value)}>
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
            <select value={invoiceFilters.sort} onChange={(event) => setInvoiceFilter('sort', event.target.value)}>
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div className="admin-table-wrap invoice-table-wrap">
            <table className="admin-table erp-click-table invoice-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Order ID</th>
                  <th>Transaction ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedInvoices.length === 0 ? (
                  <tr><td colSpan="8">No invoices match your filters.</td></tr>
                ) : pagedInvoices.map((invoice) => {
                  const invoiceKey = invoice.invoiceId || invoice.id || invoice._id;
                  return (
                    <tr key={invoiceKey}>
                      <td><strong>{invoice.invoiceId || invoice.invoiceNumber}</strong></td>
                      <td>{invoice.orderId}</td>
                      <td>{invoice.transactionId}</td>
                      <td>
                        <div className="invoice-customer-cell">
                          <span>{getInitials(invoice.customer, invoice.email)}</span>
                          <div><strong>{invoice.customer}</strong><small>{invoice.email}</small></div>
                        </div>
                      </td>
                      <td>{formatLkr(invoice.amount || invoice.grandTotal)}</td>
                      <td><StatusPill status={invoice.status} /></td>
                      <td>{formatDate(invoice.date || invoice.issueDate)}</td>
                      <td>
                        <div className="admin-actions invoice-actions">
                          <button className="admin-action admin-action-open" type="button" title="View invoice" onClick={() => viewInvoiceDetails(invoice)}><FaEye /></button>
                          <button className="admin-action admin-action-message" type="button" title="Download PDF" disabled={invoiceActionId === `download-${invoiceKey}`} onClick={() => downloadInvoicePdf(invoice)}><FaDownload /></button>
                          <button className="admin-action admin-action-processing" type="button" title="Send email" disabled={invoiceActionId === `email-${invoiceKey}`} onClick={() => openInvoiceEmailComposer(invoice)}><FaEnvelope /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="invoice-pagination">
            <span>Showing {start}-{end} of {filteredInvoices.length}</span>
            <div>
              <button type="button" disabled={invoicePage <= 1} onClick={() => setInvoiceFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}><FaChevronLeft /></button>
              <strong>{invoicePage} / {invoiceTotalPages}</strong>
              <button type="button" disabled={invoicePage >= invoiceTotalPages} onClick={() => setInvoiceFilters((prev) => ({ ...prev, page: Math.min(invoiceTotalPages, prev.page + 1) }))}><FaChevronRight /></button>
            </div>
          </div>
        </section>

        {selectedInvoice && (
          <div className="invoice-modal-layer" role="dialog" aria-modal="true" aria-labelledby="invoice-details-title" aria-describedby="invoice-details-description">
            <button className="invoice-modal-scrim" type="button" onClick={() => setSelectedInvoice(null)} aria-label="Close invoice details" />
            <aside className="invoice-luxury-drawer">
              <button className="admin-close" type="button" onClick={() => setSelectedInvoice(null)}>Close</button>
              <header className="invoice-detail-hero">
                <div>
                  <span>Invoice Details</span>
                  <h3 id="invoice-details-title">{selectedInvoice.invoiceId || selectedInvoice.invoiceNumber}</h3>
                  <p id="invoice-details-description">{selectedInvoice.customer || selectedInvoice.customerName}</p>
                </div>
                <StatusPill status={selectedInvoice.paymentStatus || selectedInvoice.status} />
              </header>

              <section className="invoice-detail-glass invoice-detail-summary">
                <div><span>Order ID</span><strong>{selectedInvoice.orderId}</strong></div>
                <div><span>Transaction ID</span><strong>{selectedInvoice.transactionId}</strong></div>
                <div><span>Invoice Date</span><strong>{formatDateTime(selectedInvoice.date || selectedInvoice.issueDate)}</strong></div>
                <div><span>Grand Total</span><strong>{formatLkr(selectedInvoice.grandTotal || selectedInvoice.amount)}</strong></div>
              </section>

              <section className="invoice-detail-grid">
                <div className="invoice-detail-glass">
                  <h4>Customer</h4>
                  <strong>{selectedInvoice.customer || selectedInvoice.customerName}</strong>
                  <p>{selectedInvoice.email || selectedInvoice.customerEmail}</p>
                  <p>{selectedInvoice.phone || selectedInvoice.customerPhone}</p>
                  <p>{selectedInvoice.customerAddressText || 'No address supplied'}</p>
                </div>
                <div className="invoice-detail-glass">
                  <h4>Payment</h4>
                  <div className="invoice-detail-pairs">
                    <span>Invoice ID</span><strong>{selectedInvoice.invoiceId}</strong>
                    <span>Status</span><strong>{selectedInvoice.paymentStatus || selectedInvoice.status}</strong>
                    <span>PDF</span><strong>{selectedInvoice.pdfUrl ? 'Attached' : 'Not generated'}</strong>
                  </div>
                </div>
              </section>

              <section className="invoice-detail-products">
                <div className="invoice-detail-section-head">
                  <span>Purchased pieces</span>
                  <strong>{(selectedInvoice.products || []).length} item{(selectedInvoice.products || []).length === 1 ? '' : 's'}</strong>
                </div>
                {(selectedInvoice.products || []).map((item) => (
                  <article key={item.id || item.name}>
                    <span className="invoice-item-thumb">{item.image ? <img src={resolveImageUrl(item.image)} alt={item.name} /> : item.name?.slice(0, 1)}</span>
                    <div><strong>{item.name}</strong><small>SKU: {item.sku || item.product || 'ASTRAVIA'}</small></div>
                    <em>Qty {item.quantity}</em>
                    <em>{formatLkr(item.price)}</em>
                    <b>{formatLkr(Number(item.price || 0) * Number(item.quantity || 1))}</b>
                  </article>
                ))}
              </section>

              <section className="invoice-detail-totals">
                <p><span>Subtotal</span><strong>{formatLkr(selectedInvoice.subtotal)}</strong></p>
                <p><span>Shipping</span><strong>{formatLkr(selectedInvoice.shipping)}</strong></p>
                <p><span>Discount</span><strong>{formatLkr(selectedInvoice.discount)}</strong></p>
                <p><span>Tax</span><strong>{formatLkr(selectedInvoice.tax)}</strong></p>
                <p className="grand-total"><span>Grand Total</span><strong>{formatLkr(selectedInvoice.grandTotal || selectedInvoice.amount)}</strong></p>
              </section>
            </aside>
          </div>
        )}

        {emailComposer && (
          <div className="invoice-modal-layer" role="dialog" aria-modal="true" aria-labelledby="invoice-email-title" aria-describedby="invoice-email-description">
            <button className="invoice-modal-scrim" type="button" onClick={() => setEmailComposer(null)} aria-label="Close email composer" />
            <aside className="invoice-email-composer">
              <button className="admin-close" type="button" onClick={() => setEmailComposer(null)}>Close</button>
              <header className="invoice-email-head">
                <div className="invoice-email-avatar">{getInitials(emailComposer.invoice.customer, emailComposer.invoice.email)}</div>
                <div>
                  <span>Send Invoice Email</span>
                  <h3 id="invoice-email-title">{emailComposer.invoice.invoiceId || emailComposer.invoice.invoiceNumber}</h3>
                  <p id="invoice-email-description">Review the message before sending the attached invoice PDF.</p>
                </div>
              </header>

              <div className="invoice-email-layout">
                <form className="invoice-email-form" onSubmit={(event) => { event.preventDefault(); submitInvoiceEmail(); }}>
                  <label>
                    <span>Customer Email</span>
                    <input value={emailComposer.to} onChange={(event) => updateEmailComposer('to', event.target.value)} />
                  </label>
                  <label>
                    <span>Subject</span>
                    <input className="invoice-email-subject" value={emailComposer.subject} onChange={(event) => updateEmailComposer('subject', event.target.value)} />
                  </label>
                  <label>
                    <span>Message</span>
                    <textarea value={emailComposer.message} onChange={(event) => updateEmailComposer('message', event.target.value)} rows="12" />
                  </label>
                  <div className="invoice-attachment-card">
                    <FaDownload aria-hidden="true" />
                    <div>
                      <strong>{emailComposer.invoice.invoiceId || 'invoice'}.pdf</strong>
                      <span>{emailComposer.invoice.pdfUrl ? 'Saved invoice PDF will be attached.' : 'PDF will be generated before sending.'}</span>
                      {emailComposer.invoice.pdfUrl && <a href={invoicePdfFileUrl(emailComposer.invoice)} target="_blank" rel="noreferrer">Preview attachment</a>}
                    </div>
                  </div>
                  <button className="invoice-send-button" type="submit" disabled={invoiceActionId === `email-${emailComposer.invoice.invoiceId || emailComposer.invoice.id || emailComposer.invoice._id}`}>
                    {invoiceActionId ? 'Sending...' : 'Send Invoice Email'}
                  </button>
                </form>

                <aside className="invoice-email-sidebar">
                  <span>Invoice Summary</span>
                  <h4>{formatLkr(emailComposer.invoice.grandTotal || emailComposer.invoice.amount)}</h4>
                  <p><span>Order ID</span><strong>{emailComposer.invoice.orderId}</strong></p>
                  <p><span>Transaction ID</span><strong>{emailComposer.invoice.transactionId}</strong></p>
                  <p><span>Payment</span><strong>{emailComposer.invoice.paymentStatus || emailComposer.invoice.status}</strong></p>
                  <p><span>Customer</span><strong>{emailComposer.invoice.customer}</strong></p>
                </aside>
              </div>
            </aside>
          </div>
        )}
      </div>
    );
  };

  const renderCMS = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Homepage</span><h2>Homepage Editor</h2></div>
        {homepageContent && (
          <form className="admin-form" onSubmit={saveHomepage}>
            <label>Hero Title<textarea value={homepageContent.heroTitle || ''} onChange={(e) => setHomepageContent((prev) => ({ ...prev, heroTitle: e.target.value }))} /></label>
            <label>Hero Subtitle<textarea value={homepageContent.heroSubtitle || ''} onChange={(e) => setHomepageContent((prev) => ({ ...prev, heroSubtitle: e.target.value }))} /></label>
            <label>Button Text<input value={homepageContent.buttonText || ''} onChange={(e) => setHomepageContent((prev) => ({ ...prev, buttonText: e.target.value }))} /></label>
            <label>Button Link<input value={homepageContent.buttonLink || ''} onChange={(e) => setHomepageContent((prev) => ({ ...prev, buttonLink: e.target.value }))} /></label>
            <label>Section Title<input value={homepageContent.section2Title || ''} onChange={(e) => setHomepageContent((prev) => ({ ...prev, section2Title: e.target.value }))} /></label>
            <label>Featured Categories<input value={(homepageContent.featuredCategories || []).join(', ')} onChange={(e) => setHomepageContent((prev) => ({ ...prev, featuredCategories: (e.target.value || '').split(',').map((item) => item.trim()).filter(Boolean) }))} /></label>
            <div className="admin-image-manager">
              <div className="admin-image-head"><span>Hero Images</span></div>
              <div className="admin-image-list">
                {[
                  ['heroImage', 'Primary hero image'],
                  ['heroImageSecondary', 'Secondary hero image'],
                  ['section2Image', 'Section image'],
                ].map(([key, label]) => (
                  <div className="admin-image-row" key={key}>
                    <div className="admin-image-preview">{homepageContent[key] ? <img src={homepageContent[key]} alt={label} /> : <span>Image</span>}</div>
                    <input value={homepageContent[key] || ''} placeholder={label} onChange={(e) => setHomepageContent((prev) => ({ ...prev, [key]: e.target.value }))} />
                    <label className="admin-upload-inline">Upload<input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadCmsImage(e.target.files[0], (url) => setHomepageContent((prev) => ({ ...prev, [key]: url })))} /></label>
                  </div>
                ))}
              </div>
            </div>
            <button className="admin-primary" type="submit">Save Homepage</button>
          </form>
        )}
      </section>

      <section className="admin-panel">
        <div className="admin-section-head"><span>Banners</span><h2>Banner Manager</h2></div>
        <form className="admin-form compact" onSubmit={saveBanner}>
          <label>Title<input value={bannerForm.title} onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
          <label>Image URL<input value={bannerForm.imageUrl} onChange={(e) => setBannerForm((prev) => ({ ...prev, imageUrl: e.target.value }))} /></label>
          <label>Link<input value={bannerForm.link} onChange={(e) => setBannerForm((prev) => ({ ...prev, link: e.target.value }))} /></label>
          <label className="admin-check"><input type="checkbox" checked={bannerForm.isActive} onChange={(e) => setBannerForm((prev) => ({ ...prev, isActive: e.target.checked }))} /> Active</label>
          <button className="admin-primary" type="submit">Add Banner</button>
        </form>
        <DataTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link' },
            { key: 'active', label: 'Active' },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => toggleBanner(row.raw)}>{row.raw.isActive ? 'Disable' : 'Enable'}</button><button onClick={() => deleteBanner(row.id)}>Delete</button></div> },
          ]}
          rows={banners.map((banner) => ({ id: banner._id, raw: banner, title: banner.title, link: banner.link || '-', active: banner.isActive ? 'Yes' : 'No' }))}
        />
      </section>

      <section className="admin-panel">
        <div className="admin-section-head"><span>Pages</span><h2>Pages Editor</h2></div>
        <form className="admin-form" onSubmit={savePageContent}>
          <label>Page<select value={pageEditor.pageName} onChange={(e) => loadPageContent(e.target.value)}><option value="about">About</option><option value="contact">Contact</option><option value="returns">Returns</option><option value="sizeguide">Size Guide</option></select></label>
          <label className="wide">Content<textarea value={pageEditor.content} onChange={(e) => setPageEditor((prev) => ({ ...prev, content: e.target.value }))} /></label>
          <button className="admin-primary" type="submit">Save Page</button>
        </form>
      </section>
    </>
  );

  const renderSettings = () => {
    const providerOptions = ['PayHere', 'Stripe', 'PayPal', 'Direct Bank Transfer'];
    const orderStatusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    const timeoutOptions = ['30 Minutes', '1 Hour', '4 Hours', '24 Hours'];

    const sections = [
      {
        id: 'general',
        eyebrow: 'General',
        title: 'General Settings',
        description: 'Core business identity used across the storefront, documents, and brand communications.',
        icon: FaBuilding,
        fields: [
          ['businessName', 'Business Name', 'text', 'Astravia Luxury Fashion House'],
          ['businessTagline', 'Business Tagline', 'text', 'Luxury Fashion House'],
          ['businessDescription', 'Business Description', 'textarea', 'A refined destination for contemporary luxury fashion.'],
          ['businessLogo', 'Business Logo Upload', 'upload'],
          ['favicon', 'Favicon Upload', 'upload'],
          ['websiteUrl', 'Website URL', 'url', 'https://www.astravia.com'],
          ['businessEmail', 'Business Email', 'email', 'support@astravia.com'],
          ['businessPhone', 'Business Phone', 'tel', '+94 77 123 4567'],
          ['businessAddress', 'Business Address', 'textarea', 'Colombo, Sri Lanka'],
        ],
      },
      {
        id: 'site',
        eyebrow: 'Site',
        title: 'Site Settings',
        description: 'Public store details, contact channels, and location metadata for customer-facing pages.',
        icon: FaStore,
        fields: [
          ['storeName', 'Store Name', 'text', 'Astravia'],
          ['logoUrl', 'Site Logo URL', 'url', 'https://...'],
          ['whatsappNumber', 'WhatsApp Number', 'tel', '94770000000'],
          ['contactEmail', 'Contact Email', 'email', 'hello@astravia.com'],
          ['contactPhone', 'Contact Phone', 'tel', '+94 77 123 4567'],
          ['supportEmail', 'Support Email', 'email', 'support@astravia.com'],
          ['googleMapsEmbedUrl', 'Google Maps Embed URL', 'url', 'https://www.google.com/maps/embed?...'],
          ['businessLocation', 'Business Location', 'text', 'Colombo, Sri Lanka'],
        ],
      },
      {
        id: 'payment',
        eyebrow: 'Payments',
        title: 'Payment Settings',
        description: 'Configure payment providers, credentials, currencies, and checkout methods.',
        icon: FaCreditCard,
        note: 'Merchant secret is stored on the backend only and is never returned to the browser.',
        fields: [
          ['paymentProvider', 'Payment Provider', 'select', '', providerOptions],
          ['merchantId', 'Merchant ID', 'text', 'PayHere merchant id'],
          ['merchantSecret', 'Merchant Secret', 'password', settings.hasMerchantSecret ? 'Saved - enter only to replace' : 'Merchant secret'],
          ['currency', 'Currency', 'text', 'LKR'],
          ['enableCOD', 'Enable COD', 'checkbox'],
          ['enableOnlinePayment', 'Enable Online Payments', 'checkbox'],
          ['sandboxMode', 'Sandbox Mode', 'checkbox'],
        ],
      },
      {
        id: 'email',
        eyebrow: 'Email',
        title: 'Email Settings',
        description: 'Sender identity, SMTP credentials, and transactional email feature controls.',
        icon: FaEnvelope,
        extraAction: { label: 'Send Test Email', icon: FaPaperPlane },
        fields: [
          ['senderName', 'Sender Name', 'text', 'Astravia Luxury Fashion House'],
          ['senderEmail', 'Sender Email', 'email', 'support@astravia.com'],
          ['replyToEmail', 'Reply-To Email', 'email', 'support@astravia.com'],
          ['smtpHost', 'SMTP Host', 'text', 'smtp.gmail.com'],
          ['smtpPort', 'SMTP Port', 'number', '587'],
          ['smtpUsername', 'SMTP Username', 'text', 'astravia.business@gmail.com'],
          ['smtpPassword', 'SMTP Password', 'password', 'SMTP password'],
          ['orderConfirmationEmails', 'Order Confirmation Emails', 'checkbox'],
          ['invoiceEmails', 'Invoice Emails', 'checkbox'],
          ['contactFormEmails', 'Contact Form Emails', 'checkbox'],
          ['newsletterEmails', 'Newsletter Emails', 'checkbox'],
        ],
      },
      {
        id: 'orders',
        eyebrow: 'Orders',
        title: 'Order Settings',
        description: 'Automation rules for invoices, order status movement, cancellations, and refunds.',
        icon: FaClipboardList,
        fields: [
          ['autoInvoiceGeneration', 'Auto Invoice Generation', 'checkbox'],
          ['autoStatusUpdates', 'Auto Status Updates', 'checkbox'],
          ['allowOrderCancellation', 'Allow Order Cancellation', 'checkbox'],
          ['allowRefundRequests', 'Allow Refund Requests', 'checkbox'],
          ['defaultOrderStatus', 'Default Order Status', 'select', '', orderStatusOptions],
        ],
      },
      {
        id: 'shipping',
        eyebrow: 'Shipping',
        title: 'Shipping Settings',
        description: 'Delivery availability, fees, thresholds, and expected customer delivery windows.',
        icon: FaTruck,
        fields: [
          ['enableShipping', 'Enable Shipping', 'checkbox'],
          ['freeShippingThreshold', 'Free Shipping Threshold', 'number', '250000'],
          ['defaultShippingFee', 'Default Shipping Fee', 'number', '5000'],
          ['estimatedDeliveryDays', 'Estimated Delivery Days', 'text', '3-5 business days'],
        ],
      },
      {
        id: 'social',
        eyebrow: 'Social',
        title: 'Social Media Settings',
        description: 'Official Astravia social channels shown across content and customer touchpoints.',
        icon: FaShareAlt,
        fields: [
          ['facebookUrl', 'Facebook URL', 'url'],
          ['instagramUrl', 'Instagram URL', 'url'],
          ['tiktokUrl', 'TikTok URL', 'url'],
          ['pinterestUrl', 'Pinterest URL', 'url'],
          ['linkedinUrl', 'LinkedIn URL', 'url'],
          ['youtubeUrl', 'YouTube URL', 'url'],
        ],
      },
      {
        id: 'seo',
        eyebrow: 'SEO',
        title: 'SEO Settings',
        description: 'Search metadata and social sharing previews for a polished digital presence.',
        icon: FaSearchDollar,
        fields: [
          ['metaTitle', 'Meta Title', 'text', 'Astravia Luxury Fashion House'],
          ['metaDescription', 'Meta Description', 'textarea'],
          ['metaKeywords', 'Meta Keywords', 'textarea', 'luxury fashion, designer wear, Astravia'],
          ['openGraphImageUrl', 'Open Graph Image URL', 'url'],
        ],
      },
      {
        id: 'security',
        eyebrow: 'Security',
        title: 'Security Settings',
        description: 'Administrative access, sessions, passwords, and elevated protection controls.',
        icon: FaShieldAlt,
        fields: [
          ['adminEmail', 'Admin Email', 'email', 'admin@astravia.com'],
          ['adminPassword', 'Change Admin Password', 'password', 'New password'],
          ['sessionTimeout', 'Session Timeout', 'select', '', timeoutOptions],
          ['enable2FA', 'Enable 2FA', 'checkbox'],
        ],
      },
      {
        id: 'appearance',
        eyebrow: 'Appearance',
        title: 'Appearance Settings',
        description: 'Brand colors and theme controls for the Astravia luxury experience.',
        icon: FaPalette,
        fields: [
          ['primaryColor', 'Primary Color', 'color', '#0A0A0A'],
          ['secondaryColor', 'Secondary Color', 'color', '#F9F8F6'],
          ['accentColor', 'Accent Color', 'color', '#D8C4A0'],
          ['enableDarkTheme', 'Enable Dark Theme', 'checkbox'],
          ['enableLuxuryTheme', 'Enable Luxury Theme', 'checkbox'],
        ],
      },
      {
        id: 'invoice',
        eyebrow: 'Invoices',
        title: 'Invoice Settings',
        description: 'Invoice numbering, registration details, tax identifiers, and branded document assets.',
        icon: FaFileInvoice,
        fields: [
          ['invoicePrefix', 'Invoice Prefix', 'text', 'INV'],
          ['invoiceFooterMessage', 'Invoice Footer Message', 'textarea', 'Thank you for choosing Astravia.'],
          ['companyRegistrationNumber', 'Company Registration Number', 'text'],
          ['taxNumber', 'Tax Number', 'text'],
          ['companyStamp', 'Upload Company Stamp', 'upload'],
        ],
      },
      {
        id: 'system',
        eyebrow: 'System',
        title: 'Backup & System',
        description: 'Operational backups, restoration controls, and system-level setting maintenance.',
        icon: FaDatabase,
        fields: [],
        actions: ['Download Backup', 'Restore Backup', 'Reset Settings'],
      },
    ];

    const normalizedSearch = settingsSearch.trim().toLowerCase();
    const visibleSections = normalizedSearch
      ? sections.filter((section) => {
        const haystack = [
          section.eyebrow,
          section.title,
          section.description,
          ...section.fields.map((field) => field[1]),
        ].join(' ').toLowerCase();
        return haystack.includes(normalizedSearch);
      })
      : sections;

    const renderField = ([key, label, type = 'text', placeholder = '', options = []]) => {
      const id = `setting-${key}`;
      if (type === 'checkbox') {
        return (
          <label className="settings-toggle" key={key} htmlFor={id}>
            <span>{label}</span>
            <input id={id} type="checkbox" checked={Boolean(settings[key])} onChange={(event) => updateSetting(key, event.target.checked)} />
            <i aria-hidden="true" />
          </label>
        );
      }
      if (type === 'upload') {
        return (
          <label className="settings-upload" key={key} htmlFor={id}>
            <span>{label}</span>
            <div><FaUpload /> Choose file</div>
            <input id={id} type="file" onChange={(event) => updateSetting(key, event.target.files?.[0]?.name || '')} />
            {settings[key] && <small>{settings[key]}</small>}
          </label>
        );
      }
      if (type === 'select') {
        return (
          <label className="settings-field" key={key} htmlFor={id}>
            <span>{label}</span>
            <select id={id} value={settings[key] || options[0] || ''} onChange={(event) => updateSetting(key, event.target.value)}>
              {options.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        );
      }
      if (type === 'textarea') {
        return (
          <label className="settings-field wide" key={key} htmlFor={id}>
            <span>{label}</span>
            <textarea id={id} value={settings[key] || ''} placeholder={placeholder} onChange={(event) => updateSetting(key, event.target.value)} />
          </label>
        );
      }
      return (
        <label className={`settings-field ${type === 'color' ? 'color' : ''}`} key={key} htmlFor={id}>
          <span>{label}</span>
          <input
            id={id}
            type={type}
            value={settings[key] || (type === 'color' ? placeholder : '')}
            placeholder={placeholder}
            onChange={(event) => updateSetting(key, event.target.value)}
          />
        </label>
      );
    };

    return (
      <div className="settings-page">
        <section className="settings-hero">
          <div>
            <span className="admin-eyebrow">Configuration Center</span>
            <h2>Astravia Settings</h2>
            <p>Manage brand identity, payments, email, operations, security, and customer-facing configuration from one polished control room.</p>
          </div>
          <div className="settings-search">
            <FaSearch />
            <input value={settingsSearch} onChange={(event) => setSettingsSearch(event.target.value)} placeholder="Search settings..." />
          </div>
        </section>

        {settingsDirty && (
          <div className="settings-unsaved">
            <FaCog />
            <span>You have unsaved configuration changes.</span>
          </div>
        )}

        <div className="settings-grid">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const ExtraIcon = section.extraAction?.icon;
            return (
              <section className="settings-card" key={section.id}>
                <div className="settings-card-head">
                  <div className="settings-icon"><Icon /></div>
                  <div>
                    <span>{section.eyebrow}</span>
                    <h3>{section.title}</h3>
                    <p>{section.description}</p>
                  </div>
                </div>
                <form className="settings-form" onSubmit={(event) => handleSettingsSubmit(event, section.id)}>
                  {section.fields.map(renderField)}
                  {section.note && <p className="settings-note">{section.note}</p>}
                  {section.extraAction && (
                    <button className="settings-secondary" type="button" onClick={() => setMessage('Test email queued successfully')}>
                      <ExtraIcon /> {section.extraAction.label}
                    </button>
                  )}
                  {section.actions && (
                    <div className="settings-system-actions">
                      {section.actions.map((action) => (
                        <button key={action} type="button" onClick={() => setMessage(`${action} requested successfully`)}>
                          {action === 'Download Backup' ? <FaDownload /> : <FaDatabase />} {action}
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="settings-save" type="submit"><FaSave /> Save {section.eyebrow}</button>
                </form>
              </section>
            );
          })}
        </div>

        {visibleSections.length === 0 && (
          <section className="settings-empty">
            <FaSearch />
            <h3>No settings found</h3>
            <p>Try searching for payments, email, invoices, shipping, or security.</p>
          </section>
        )}
      </div>
    );
  };

  const renderActive = () => {
    if (active === 'Products') return renderProducts();
    if (active === 'Sales') return renderSales();
    if (active === 'Orders') return renderOrders();
    if (active === 'Customers') return renderCustomers();
    if (active === 'Inventory') return renderInventory();
    if (active === 'Finance') return renderFinance();
    if (active === 'Analytics') return renderAnalytics();
    if (active === 'Marketing') return renderMarketing();
    if (active === 'Bulk Orders') return renderBulkOrders();
    if (active === 'Transactions') return renderTransactions();
    if (active === 'Invoices') return renderInvoices();
    if (active === 'CMS') return renderCMS();
    if (active === 'Settings') return renderSettings();
    return renderDashboard();
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand" aria-label="Admin dashboard brand">
          <img src={adminLogo} alt="Admin dashboard logo" />
        </div>
        <nav className="admin-sidebar-nav">{menuItems.map((item) => <button key={item} className={active === item ? 'active' : ''} onClick={() => changeAdminSection(item)}>{item}</button>)}</nav>
        <div className="admin-sidebar-footer">
          <button type="button" className="admin-logout-button" onClick={handleLogout}>
            <FaSignOutAlt aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-eyebrow">Business Management</span><h1>{active}</h1></div>
          <div className="admin-top-note">SS26 Operations</div>
        </header>
        {renderActive()}
      </main>
    </div>
  );
}
