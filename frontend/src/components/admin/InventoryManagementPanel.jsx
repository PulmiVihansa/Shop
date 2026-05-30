import { Fragment, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiBarChart2, FiBox, FiPackage, FiSearch, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import api, { getErrorMessage } from '../../services/api.js';
import '../../styles/inventory-dashboard.css';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const LOW_STOCK_LIMIT = 15;

const fallbackDashboard = {
  summary: {
    totalProducts: 0,
    totalInventoryValue: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalUnits: 0
  },
  items: [],
  lowStockList: [],
  insights: {
    highestStockProduct: null,
    lowestStockProduct: null,
    mostValuableProduct: null,
    totalInventoryValue: 0,
    stockByCategory: [],
    stockDistributionByCategory: [],
    lowStockTrend: []
  }
};

const money = (value, currency = 'LKR') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const dateText = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStatus = (stock, reorderThreshold) => {
  if (Number(stock || 0) === 0) return { label: 'Out of Stock', className: 'out' };
  if (Number(stock || 0) < Number(reorderThreshold || LOW_STOCK_LIMIT)) return { label: 'Low Stock', className: 'low' };
  return { label: 'In Stock', className: 'healthy' };
};

export default function InventoryManagementPanel({ products, onRefreshData, currency = 'LKR' }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const [dashboard, setDashboard] = useState(fallbackDashboard);
  const [filters, setFilters] = useState({
    name: '',
    sku: '',
    collection: '',
    category: '',
    subcategory: '',
    sortBy: 'recent'
  });

  const collections = useMemo(
    () => Array.from(new Set((dashboard.items || []).map((item) => item.collection).filter(Boolean))).sort(),
    [dashboard.items]
  );
  const categories = useMemo(
    () => Array.from(new Set((dashboard.items || []).map((item) => item.category).filter(Boolean))).sort(),
    [dashboard.items]
  );
  const subcategories = useMemo(
    () => Array.from(new Set((dashboard.items || []).map((item) => item.subcategory).filter(Boolean))).sort(),
    [dashboard.items]
  );

  const load = async (query = filters, withSkeleton = false) => {
    if (withSkeleton) setLoading(true);
    setError('');
    try {
      const response = await api.get('/products/inventory/dashboard', {
        params: {
          name: query.name || undefined,
          sku: query.sku || undefined,
          collection: query.collection || undefined,
          category: query.category || undefined,
          subcategory: query.subcategory || undefined,
          sortBy: query.sortBy || 'recent'
        }
      });
      setDashboard(response.data || fallbackDashboard);
    } catch (err) {
      setError(getErrorMessage(err));
      const fallbackItems = (products || []).map((item) => {
        const stock = Number(item.stock || 0);
        const value = stock * Number(item.price || 0);
        return {
          ...item,
          inventoryValue: value,
          reorderThreshold: LOW_STOCK_LIMIT,
          sizeStock: item.sizeStock || {}
        };
      });
      setDashboard({
        ...fallbackDashboard,
        summary: {
          totalProducts: fallbackItems.length,
          totalInventoryValue: fallbackItems.reduce((sum, item) => sum + Number(item.inventoryValue || 0), 0),
          lowStockProducts: fallbackItems.filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) < LOW_STOCK_LIMIT).length,
          outOfStockProducts: fallbackItems.filter((item) => Number(item.stock || 0) === 0).length,
          totalUnits: fallbackItems.reduce((sum, item) => sum + Number(item.stock || 0), 0)
        },
        items: fallbackItems
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load(filters, true);
    }, 160);
    return () => window.clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    if (!loading) {
      load(filters, false);
    }
  }, [products]);

  const summaryCards = [
    { label: 'Total Products', value: dashboard.summary.totalProducts, icon: <FiBox /> },
    { label: 'Total Inventory Value', value: money(dashboard.summary.totalInventoryValue, currency), icon: <FiTrendingUp /> },
    { label: 'Low Stock Products', value: dashboard.summary.lowStockProducts, icon: <FiAlertCircle /> },
    { label: 'Out Of Stock Products', value: dashboard.summary.outOfStockProducts, icon: <FiTrendingDown /> },
    { label: 'Total Units In Inventory', value: dashboard.summary.totalUnits, icon: <FiPackage /> }
  ];

  const clearFilters = () => {
    setFilters({
      name: '',
      sku: '',
      collection: '',
      category: '',
      subcategory: '',
      sortBy: 'recent'
    });
  };

  const refresh = async () => {
    await onRefreshData();
    await load(filters, true);
  };

  const lowStockAlertItems = useMemo(
    () => (dashboard.items || []).filter((item) => Number(item.stock || 0) > 0 && Number(item.stock || 0) < LOW_STOCK_LIMIT),
    [dashboard.items]
  );
  const outOfStockAlertItems = useMemo(
    () => (dashboard.items || []).filter((item) => Number(item.stock || 0) === 0),
    [dashboard.items]
  );

  return (
    <div className="inv-wrap inv-premium">
      <section className="inv-summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="inv-summary-card">
            <div className="inv-summary-icon">{card.icon}</div>
            <p>{card.label}</p>
            <strong>{loading ? '...' : card.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel inv-panel">
        <div className="inv-toolbar">
          <div className="inv-toolbar-head">
            <div>
              <span className="admin-eyebrow">Inventory Studio</span>
              <h2>Inventory Overview</h2>
            </div>
            <div className="inv-toolbar-actions">
              <button type="button" className="inv-ghost-btn" onClick={refresh}>Refresh</button>
              <button type="button" className="inv-ghost-btn" onClick={clearFilters}>Clear Filters</button>
            </div>
          </div>

          <div className="inv-filters">
            <label>
              <FiSearch />
              <input
                value={filters.name}
                placeholder="Search product name"
                onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
              />
            </label>
            <input
              value={filters.sku}
              placeholder="Search SKU"
              onChange={(event) => setFilters((prev) => ({ ...prev, sku: event.target.value }))}
            />
            <select
              value={filters.collection}
              onChange={(event) => setFilters((prev) => ({ ...prev, collection: event.target.value }))}
            >
              <option value="">All Collections</option>
              {collections.map((collection) => (
                <option key={collection} value={collection}>{collection}</option>
              ))}
            </select>
            <select
              value={filters.category}
              onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filters.subcategory}
              onChange={(event) => setFilters((prev) => ({ ...prev, subcategory: event.target.value }))}
            >
              <option value="">All Subcategories</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory} value={subcategory}>{subcategory}</option>
              ))}
            </select>
            <select
              value={filters.sortBy}
              onChange={(event) => setFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
            >
              <option value="recent">Recently Added</option>
              <option value="name">Name</option>
              <option value="stock">Stock</option>
              <option value="price">Price</option>
              <option value="value">Inventory Value</option>
            </select>
          </div>
        </div>

        {error && <p className="inv-inline-error">{error}</p>}

        <div className="inv-table-shell">
          <table className="inv-table">
            <thead>
              <tr>
                <th />
                <th>Product Image</th>
                <th>Product Name</th>
                <th>Collection</th>
                <th>Category</th>
                <th>Subcategory</th>
                <th>Price</th>
                <th>Total Stock</th>
                <th>Inventory Value</th>
                <th>Stock Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <tr key={`loading-${index}`}>
                  <td colSpan={11}><div className="inv-skeleton-row" /></td>
                </tr>
              ))}

              {!loading && dashboard.items.length === 0 && (
                <tr>
                  <td colSpan={11}><div className="inv-empty-state"><h3>No matching products</h3><p>Try a different search or clear filters.</p></div></td>
                </tr>
              )}

              {!loading && dashboard.items.map((item) => {
                const status = getStatus(item.stock, item.reorderThreshold);
                const isOpen = expandedId === item.id;
                const lowWarning = Number(item.stock || 0) > 0 && Number(item.stock || 0) < Number(item.reorderThreshold || LOW_STOCK_LIMIT);

                return (
                  <Fragment key={item.id}>
                    <tr className={isOpen ? 'inv-row-open' : ''}>
                      <td>
                        <button type="button" className="inv-expand-btn" onClick={() => setExpandedId((prev) => (prev === item.id ? '' : item.id))}>
                          {isOpen ? '-' : '+'}
                        </button>
                      </td>
                      <td>
                        <div className="inv-product-image">
                          {item.images?.[0] ? <img src={item.images[0]} alt={item.name} /> : <span>No image</span>}
                        </div>
                      </td>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.collection || '-'}</td>
                      <td>{item.category || '-'}</td>
                      <td>{item.subcategory || '-'}</td>
                      <td>{money(item.price, currency)}</td>
                      <td>{item.stock}</td>
                      <td>{money(item.inventoryValue, currency)}</td>
                      <td><span className={`inv-status ${status.className}`}>{status.label}</span></td>
                      <td>{dateText(item.updatedAt)}</td>
                    </tr>
                    {isOpen && (
                      <tr className="inv-expanded-row">
                        <td colSpan={11}>
                          <div className="inv-expanded-content">
                            <div className="inv-size-grid">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Size</th>
                                    <th>Available Quantity</th>
                                    <th>Indicator</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {SIZES.map((size) => {
                                    const qty = Number(item.sizeStock?.[size] || 0);
                                    const sizeStatus = qty === 0 ? 'out' : qty < LOW_STOCK_LIMIT ? 'low' : 'healthy';
                                    return (
                                      <tr key={`${item.id}-${size}`}>
                                        <td>{size}</td>
                                        <td>{qty}</td>
                                        <td><span className={`inv-status ${sizeStatus}`}>{qty === 0 ? 'Out of Stock' : qty < LOW_STOCK_LIMIT ? 'Low Stock' : 'In Stock'}</span></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            <div className="inv-health">
                              <p>Total Stock: <strong>{item.stock}</strong></p>
                              <p>Inventory Value: <strong>{money(item.inventoryValue, currency)}</strong></p>
                              <p>Low Stock Warning: <strong>{lowWarning ? `Warning: below ${LOW_STOCK_LIMIT} units` : `Healthy: ${LOW_STOCK_LIMIT}+ units`}</strong></p>
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

      <section className="admin-panel inv-panel">
        <div className="admin-section-head">
          <span>Inventory Analytics</span>
          <h2>Stock Intelligence</h2>
        </div>

        <div className="inv-alert-banner">
          <strong>Inventory Alerts</strong>
          <span>{lowStockAlertItems.length} low stock product(s) below {LOW_STOCK_LIMIT} units</span>
          <span>{outOfStockAlertItems.length} out of stock product(s)</span>
        </div>
        {(lowStockAlertItems.length > 0 || outOfStockAlertItems.length > 0) && (
          <div className="inv-alert-list">
            {outOfStockAlertItems.slice(0, 6).map((item) => (
              <p key={`out-${item.id}`}>{item.name} is out of stock.</p>
            ))}
            {lowStockAlertItems.slice(0, 6).map((item) => (
              <p key={`low-${item.id}`}>{item.name} is low ({item.stock} units, below {LOW_STOCK_LIMIT}).</p>
            ))}
          </div>
        )}

        <div className="inv-insight-cards">
          <article><p>Highest Stock Product</p><strong>{dashboard.insights.highestStockProduct?.name || '-'}</strong></article>
          <article><p>Lowest Stock Product</p><strong>{dashboard.insights.lowestStockProduct?.name || '-'}</strong></article>
          <article><p>Most Valuable Product</p><strong>{dashboard.insights.mostValuableProduct?.name || '-'}</strong></article>
          <article><p>Total Inventory Value</p><strong>{money(dashboard.insights.totalInventoryValue, currency)}</strong></article>
          <article><p>Low Stock Count</p><strong>{dashboard.summary.lowStockProducts}</strong></article>
        </div>

        <div className="inv-chart-card">
          <h3><FiBarChart2 /> Category Distribution</h3>
          {(dashboard.insights.stockDistributionByCategory || []).map((item) => {
            const max = Math.max(...(dashboard.insights.stockDistributionByCategory || []).map((entry) => Number(entry.stock || 0)), 1);
            const width = (Number(item.stock || 0) / max) * 100;
            return (
              <div key={item.label} className="inv-bar">
                <span>{item.label}</span>
                <div><i style={{ width: `${width}%` }} /></div>
                <strong>{item.stock}</strong>
              </div>
            );
          })}
          {!dashboard.insights.stockDistributionByCategory?.length && <p className="inv-chart-empty">No category data yet.</p>}
        </div>

        <div className="inv-low-list">
          <h3>Products Needing Restock</h3>
          {dashboard.lowStockList?.length ? (
            dashboard.lowStockList.map((item) => (
              <div key={item.id} className="inv-low-row">
                <span>{item.name}</span>
                <small>
                  <span className="inv-low-current">Current: {item.stock}</span>
                  <span className="inv-low-sep"> | </span>
                  <span className="inv-low-reorder">Reorder: {item.reorderThreshold}</span>
                  <span className="inv-low-sep"> | </span>
                  <span className="inv-low-missing">Missing: {item.missingQuantity}</span>
                </small>
              </div>
            ))
          ) : (
            <p className="inv-chart-empty">No urgent low stock products.</p>
          )}
        </div>
      </section>
    </div>
  );
}
