import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import {
  pageContentDefaults,
  parsePageContent,
  publicPageOptions,
  serializePageContent,
} from '../content/pageContentDefaults.js';
import AdminVisualCmsEmbed from '../cms/AdminVisualCmsEmbed.jsx';
import FinanceIntelligence from '../admin/FinanceIntelligence.jsx';
import '../styles/admin.css';

const money = (value) => `LKR${Number(value || 0).toLocaleString()}`;

const emptyProduct = {
  name: '',
  price: '',
  description: '',
  category: '',
  stock: '',
  sizes: [],
  tags: [],
  placements: [],
  swatches: '',
  bgClass: 'b1',
  imageClass: 'linen',
  badge: '',
  badgeText: '',
  images: [],
};

const emptyExpense = { title: '', category: 'Material cost', amount: '', date: '' };
const emptyBulkCustomer = { name: '', email: '', company: '', discount: '', notes: '' };

const menuItems = [
  'Dashboard',
  'Products',
  'Orders',
  'Customers',
  'Inventory',
  'Finance',
  'Analytics',
  'Bulk Orders',
  'Invoices',
  'CMS',
  'Settings',
];

function MetricCard({ label, value, note }) {
  return (
    <div className="admin-metric">
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
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length}>{empty}</td></tr>
          ) : rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
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
      {data.length === 0 ? <p>No chart data yet.</p> : data.map((item) => (
        <div className="admin-bar-row" key={`${item[labelKey]}-${valueKey}`}>
          <span>{item[labelKey]}</span>
          <div><i style={{ width: `${(Number(item[valueKey] || 0) / max) * 100}%` }} /></div>
          <strong>{Number(item[valueKey] || 0).toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

function ColumnChart({ data, valueKey = 'revenue', labelKey = 'label' }) {
  const max = Math.max(...data.map((item) => Number(item[valueKey] || 0)), 1);
  return (
    <div className="admin-column-chart">
      {data.length === 0 ? <p>No chart data yet.</p> : data.map((item) => {
        const value = Number(item[valueKey] || 0);
        return (
          <div className="admin-column" key={`${item[labelKey]}-${valueKey}`}>
            <strong>{value.toLocaleString()}</strong>
            <div><i style={{ height: `${Math.max(8, (value / max) * 100)}%` }} /></div>
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
  const colors = ['#8f9390', '#1a1a1a', '#a8b5a0', '#d4cdc5', '#9e8fa8'];

  if (!total) {
    return <div className="admin-pie-empty">No pie chart data yet.</div>;
  }

  return (
    <div className="admin-pie-wrap">
      <svg className="admin-pie" viewBox="0 0 42 42" aria-label="Pie chart">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#eae6e0" strokeWidth="7" />
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
              strokeWidth="7"
              strokeDasharray={`${dash} ${100 - dash}`}
              strokeDashoffset={offset}
            />
          );
          offset -= dash;
          return circle;
        })}
      </svg>
      <div className="admin-pie-legend">
        {data.map((item, index) => (
          <span key={item[labelKey]}>
            <i style={{ background: colors[index % colors.length] }} />
            {item[labelKey]}: {Number(item[valueKey] || 0).toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [bulkCustomers, setBulkCustomers] = useState([]);
  const [homepageContent, setHomepageContent] = useState(null);
  const [banners, setBanners] = useState([]);
  const [pageEditor, setPageEditor] = useState({
    pageName: 'women',
    fields: pageContentDefaults.women,
  });
  const [bannerForm, setBannerForm] = useState({ title: '', imageUrl: '', link: '', isActive: true });
  const [settings, setSettings] = useState({
    paymentProvider: 'PayHere',
    merchantId: '',
    merchantSecret: '',
    currency: 'LKR',
    enableCOD: true,
    enableOnlinePayment: true,
    whatsappNumber: '',
  });
  const [productForm, setProductForm] = useState(emptyProduct);
  const [customSize, setCustomSize] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [bulkForm, setBulkForm] = useState(emptyBulkCustomer);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    const [productRes, orderRes, userRes, analyticsRes, financeRes, bulkRes, settingsRes, homepageRes, bannerRes, siteRes, pageRes] = await Promise.all([
      api.get('/products'),
      api.get('/orders'),
      api.get('/users'),
      api.get('/analytics'),
      api.get('/finance'),
      api.get('/bulk-orders/customers'),
      api.get('/settings/payment'),
      api.get('/content/homepage'),
      api.get('/content/banners'),
      api.get('/settings'),
      api.get(`/content/page/${pageEditor.pageName}`),
    ]);
    setProducts(productRes.data);
    setOrders(orderRes.data);
    setCustomers(userRes.data);
    setAnalytics(analyticsRes.data);
    setFinance(financeRes.data);
    setBulkCustomers(bulkRes.data);
    setSettings((prev) => ({ ...prev, ...siteRes.data, ...settingsRes.data, merchantSecret: '' }));
    setHomepageContent(homepageRes.data);
    setBanners(bannerRes.data);
    setPageEditor((prev) => ({
      ...prev,
      fields: parsePageContent(pageRes.data.content, pageContentDefaults[prev.pageName] || {}),
    }));
  };

  useEffect(() => {
    loadAdminData().catch((err) => setError(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (location.pathname.startsWith('/admin/cms')) {
      setActive('CMS');
    }
  }, [location.pathname]);

  const totals = analytics?.totals || {
    users: customers.length,
    orders: orders.length,
    revenue: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    lowStock: products.filter((product) => Number(product.stock || 0) <= 5).length,
  };

  const lowStockProducts = useMemo(
    () => products.filter((product) => Object.values(product.sizeStock || {}).some((value) => Number(value || 0) > 0 && Number(value || 0) <= 10) || Number(product.stock || 0) <= 5),
    [products]
  );

  const filteredInventoryProducts = useMemo(() => {
    if (inventoryFilter === 'low') {
      return products.filter((product) => Object.values(product.sizeStock || {}).some((value) => Number(value || 0) > 0 && Number(value || 0) <= 10));
    }
    if (inventoryFilter === 'out') {
      return products.filter((product) => Object.values(product.sizeStock || {}).some((value) => Number(value || 0) === 0));
    }
    return products;
  }, [products, inventoryFilter]);

  const productPayload = {
    ...productForm,
    price: Number(productForm.price || 0),
    stock: Number(productForm.stock || 0),
    sizes: Array.isArray(productForm.sizes) ? productForm.sizes : [],
    tags: Array.isArray(productForm.tags) ? productForm.tags : [],
    placements: Array.isArray(productForm.placements) ? productForm.placements : [],
    swatches: productForm.swatches.split(',').map((item) => item.trim()).filter(Boolean),
    images: productForm.images.map((item) => item.trim()).filter(Boolean),
  };

  const toggleMultiValue = (field, value) => {
    setProductForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      const trimmed = String(value || '').trim();
      if (!trimmed) return prev;
      const next = current.includes(trimmed)
        ? current.filter((entry) => entry !== trimmed)
        : [...current, trimmed];
      return { ...prev, [field]: next };
    });
  };

  const addMultiValue = (field, value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return;
    setProductForm((prev) => {
      const current = Array.isArray(prev[field]) ? prev[field] : [];
      if (current.includes(trimmed)) return prev;
      return { ...prev, [field]: [...current, trimmed] };
    });
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

  const handleImageFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        })
    );
    const dataUrls = await Promise.all(readers);
    setProductForm((prev) => ({ ...prev, images: [...prev.images, ...dataUrls] }));
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, productPayload);
        setMessage('Product updated');
      } else {
        await api.post('/products', productPayload);
        setMessage('Product added');
      }
      setProductForm(emptyProduct);
      setCustomSize('');
      setCustomTag('');
      setEditingId(null);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editProduct = (product) => {
    setActive('Products');
    setEditingId(product.id || product._id);
    setProductForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      category: product.category || '',
      stock: product.stock || '',
      sizes: product.sizes || [],
      tags: product.tags || [],
      placements: product.placements || [],
      swatches: product.swatches?.join(', ') || '',
      images: product.images?.length ? product.images : [],
      bgClass: product.bgClass || 'b1',
      imageClass: product.imageClass || 'linen',
      badge: product.badge || '',
      badgeText: product.badgeText || '',
    });
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
    await loadAdminData();
  };

  const restock = async (id) => {
    await api.put(`/products/${id}/restock`, { quantity: 10 });
    await loadAdminData();
  };

  const updateSizeStock = async (product, size, value) => {
    const nextStock = { S: 0, M: 0, L: 0, XL: 0, ...(product.sizeStock || {}), [size]: Number(value || 0) };
    await api.put(`/products/${product.id || product._id}/restock`, { quantity: 1, sizeStock: nextStock });
    await loadAdminData();
  };

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    await loadAdminData();
  };

  const deleteCustomer = async (id) => {
    await api.delete(`/users/${id}`);
    await loadAdminData();
  };

  const submitExpense = async (event) => {
    event.preventDefault();
    await api.post('/finance/expenses', expenseForm);
    setExpenseForm(emptyExpense);
    setMessage('Expense saved');
    await loadAdminData();
  };

  const submitBulkCustomer = async (event) => {
    event.preventDefault();
    await api.post('/bulk-orders/customers', bulkForm);
    setBulkForm(emptyBulkCustomer);
    await loadAdminData();
  };

  const printInvoice = (order) => {
    const lines = order.items.map((item) => `${item.name} x ${item.quantity} - ${money(item.price * item.quantity)}`).join('\n');
    const invoice = `ATELIER INVOICE\n\nCustomer: ${order.user?.name || order.address?.fullName || 'Customer'}\nEmail: ${order.user?.email || ''}\nOrder: ${order._id}\n\n${lines}\n\nTotal: ${money(order.totalPrice)}`;
    const popup = window.open('', '_blank', 'width=720,height=900');
    popup.document.write(`<pre style="font-family:Arial;padding:32px;line-height:1.6">${invoice}</pre>`);
    popup.document.close();
    popup.print();
  };

  const whatsappUrl = (phone, text) =>
    `https://wa.me/${String(phone || settings.whatsappNumber || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;

  const messageCustomer = (order) => {
    const name = order.address?.fullName || order.user?.name || 'Customer';
    const phone = order.address?.phone || settings.whatsappNumber;
    const text = `Hi ${name}, your order #${String(order._id).slice(-6)} is being processed.`;
    window.open(whatsappUrl(phone, text), '_blank', 'noopener,noreferrer');
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    const response = await api.put('/settings/payment', settings);
    setSettings((prev) => ({ ...prev, ...response.data, merchantSecret: '' }));
    setMessage('Settings saved');
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
    setPageEditor({
      pageName,
      fields: parsePageContent(response.data.content, pageContentDefaults[pageName] || {}),
    });
  };

  const savePageContent = async (event) => {
    event.preventDefault();
    const response = await api.put(`/content/page/${pageEditor.pageName}`, {
      content: serializePageContent(pageEditor.fields),
    });
    setPageEditor({
      pageName: response.data.pageName,
      fields: parsePageContent(response.data.content, pageContentDefaults[response.data.pageName] || {}),
    });
    setMessage('Page content saved');
  };

  const updatePageField = (key, value) => {
    setPageEditor((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [key]: value,
      },
    }));
  };

  const renderDashboard = () => (
    <>
      <div className="admin-metrics">
        <MetricCard label="Total Users" value={totals.users} note="Registered accounts" />
        <MetricCard label="Total Orders" value={totals.orders} note="All order statuses" />
        <MetricCard label="Total Revenue" value={money(totals.revenue)} note="Gross sales" />
        <MetricCard label="Low Stock Alerts" value={totals.lowStock} note="5 units or fewer" />
      </div>
      <div className="admin-two-col">
        <section className="admin-panel">
          <div className="admin-section-head"><span>Recent</span><h2>Orders</h2></div>
          <DataTable
            columns={[
              { key: 'customer', label: 'Customer' },
              { key: 'total', label: 'Total' },
              { key: 'status', label: 'Status' },
            ]}
            rows={orders.slice(0, 6).map((order) => ({
              id: order._id,
              customer: order.user?.name || order.address?.fullName || 'Customer',
              total: money(order.totalPrice),
              status: order.status,
            }))}
          />
        </section>
        <section className="admin-panel">
          <div className="admin-section-head"><span>Performance</span><h2>Sales Over Time</h2></div>
          <ColumnChart data={analytics?.salesOverTime || []} />
        </section>
      </div>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Top Selling</span><h2>Products</h2></div>
        <BarChart data={analytics?.topProducts || []} valueKey="quantity" labelKey="name" />
      </section>
    </>
  );

  const renderProducts = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Catalog</span><h2>{editingId ? 'Edit Product' : 'Add Product'}</h2></div>
        <form className="admin-form" onSubmit={submitProduct}>
          {[
            ['name', 'Name'],
            ['price', 'Price'],
            ['description', 'Description'],
            ['category', 'Category'],
            ['stock', 'Stock quantity'],
            ['swatches', 'Swatches'],
            ['bgClass', 'Background class'],
            ['imageClass', 'Image class'],
            ['badgeText', 'Badge text'],
          ].map(([name, label]) => (
              <label key={name}>{label}<input name={name} value={productForm[name]} onChange={(e) => setProductForm((prev) => ({ ...prev, [name]: e.target.value }))} /></label>
          ))}

          <div className="wide">
            <p className="admin-form-label">Sizes</p>
            <div className="admin-filter-row">
              {Array.from(new Set(['XS', 'S', 'M', 'L', 'XL', ...(productForm.sizes || [])])).map((size) => (
                <label key={size} className="admin-check">
                  <input
                    type="checkbox"
                    checked={(productForm.sizes || []).includes(size)}
                    onChange={() => toggleMultiValue('sizes', size)}
                  />
                  {size}
                </label>
              ))}
            </div>
            <div className="admin-inline">
              <input
                value={customSize}
                onChange={(event) => setCustomSize(event.target.value)}
                placeholder="Add custom size (e.g., XXL)"
              />
              <button
                type="button"
                onClick={() => {
                  addMultiValue('sizes', customSize);
                  setCustomSize('');
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="wide">
            <p className="admin-form-label">Tags</p>
            <div className="admin-filter-row">
              {Array.from(new Set(['new', 'sale', 'featured', ...(productForm.tags || [])])).map((tag) => (
                <label key={tag} className="admin-check">
                  <input
                    type="checkbox"
                    checked={(productForm.tags || []).includes(tag)}
                    onChange={() => toggleMultiValue('tags', tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
            <div className="admin-inline">
              <input
                value={customTag}
                onChange={(event) => setCustomTag(event.target.value)}
                placeholder="Add custom tag"
              />
              <button
                type="button"
                onClick={() => {
                  addMultiValue('tags', customTag);
                  setCustomTag('');
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="wide">
            <p className="admin-form-label">Visible On Pages</p>
            <p className="admin-help">Leave blank to show everywhere. If you select pages, the product shows only on those pages.</p>
            <div className="admin-filter-row">
              {[
                { value: 'home-essentials', label: 'Home essentials' },
                { value: 'women', label: 'Women' },
                { value: 'men', label: 'Men' },
                { value: 'accessories', label: 'Accessories' },
                { value: 'tops', label: 'Tops' },
                { value: 'new-arrivals', label: 'New arrivals' },
                { value: 'sales', label: 'Sales' },
              ].map((placement) => (
                <label key={placement.value} className="admin-check">
                  <input
                    type="checkbox"
                    checked={(productForm.placements || []).includes(placement.value)}
                    onChange={() => toggleMultiValue('placements', placement.value)}
                  />
                  {placement.label}
                </label>
              ))}
            </div>
          </div>

          <div className="admin-image-manager">
            <div className="admin-image-head">
              <span>Images</span>
              <div>
                <button type="button" onClick={addImageField}>Add URL</button>
                <label>
                  Upload
                  <input type="file" accept="image/*" multiple onChange={handleImageFiles} />
                </label>
              </div>
            </div>
            <div className="admin-image-list">
              {productForm.images.length === 0 && <p>No product images added yet.</p>}
              {productForm.images.map((image, index) => (
                <div className="admin-image-row" key={`${image}-${index}`}>
                  <div className="admin-image-preview">
                    {image ? <img src={image} alt={`Product ${index + 1}`} /> : <span>Image</span>}
                  </div>
                  <input
                    value={image}
                    onChange={(event) => updateImageAt(index, event.target.value)}
                    placeholder="https://example.com/product-image.jpg"
                  />
                  <button type="button" onClick={() => removeImageField(index)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
          <button className="admin-primary" type="submit">{editingId ? 'Update Product' : 'Add Product'}</button>
        </form>
      </section>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Inventory</span><h2>Product List</h2></div>
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'price', label: 'Price' },
            { key: 'stock', label: 'Stock' },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => editProduct(row.raw)}>Edit</button><button onClick={() => deleteProduct(row.id)}>Delete</button></div> },
          ]}
          rows={products.map((product) => ({ id: product.id || product._id, raw: product, name: product.name, category: product.category, price: money(product.price), stock: product.stock }))}
        />
      </section>
    </>
  );

  const renderOrders = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><span>Fulfillment</span><h2>Orders</h2></div>
      <DataTable
        columns={[
          { key: 'customer', label: 'Customer' },
          { key: 'items', label: 'Items' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status', render: (row) => <select value={row.status} onChange={(e) => updateStatus(row.id, e.target.value)}><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select> },
          { key: 'actions', label: 'Details', render: (row) => <div className="admin-actions"><button onClick={() => setSelectedOrder(row.raw)}>View</button><button onClick={() => messageCustomer(row.raw)}>Message Customer</button></div> },
        ]}
        rows={orders.map((order) => ({ id: order._id, raw: order, customer: order.user?.name || order.address?.fullName || 'Customer', items: order.items.length, total: money(order.totalPrice), status: order.status }))}
      />
      {selectedOrder && (
        <div className="admin-detail">
          <button className="admin-close" onClick={() => setSelectedOrder(null)}>Close</button>
          <h3>Order Details</h3>
          <p>{selectedOrder.address?.fullName} - {selectedOrder.address?.city}, {selectedOrder.address?.country}</p>
          {selectedOrder.items.map((item) => <p key={`${item.name}-${item.size}`}>{item.name} / {item.size} / Qty {item.quantity}</p>)}
        </div>
      )}
    </section>
  );

  const renderCustomers = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><span>Customers</span><h2>Customer Management</h2></div>
      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'orders', label: 'Orders' },
          { key: 'spent', label: 'Total Spent' },
          { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => setSelectedCustomer(row.raw)}>View</button><button onClick={() => deleteCustomer(row.id)}>Delete</button></div> },
        ]}
        rows={customers.map((customer) => ({ id: customer.id || customer._id, raw: customer, name: customer.name, email: customer.email, orders: customer.totalOrders, spent: money(customer.totalSpent) }))}
      />
      {selectedCustomer && <div className="admin-detail"><button className="admin-close" onClick={() => setSelectedCustomer(null)}>Close</button><h3>{selectedCustomer.name}</h3><p>{selectedCustomer.email}</p><p>{selectedCustomer.totalOrders} orders - {money(selectedCustomer.totalSpent)}</p></div>}
    </section>
  );

  const renderInventory = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><span>Stock</span><h2>Inventory System</h2></div>
      <div className="admin-metrics">
        <MetricCard label="Products" value={products.length} />
        <MetricCard label="Low Stock" value={lowStockProducts.length} />
        <MetricCard label="Units Available" value={products.reduce((sum, product) => sum + Number(product.stock || 0), 0)} />
      </div>
      <div className="admin-filter-row">
        <button className={inventoryFilter === 'all' ? 'active' : ''} onClick={() => setInventoryFilter('all')}>All Stock</button>
        <button className={inventoryFilter === 'low' ? 'active' : ''} onClick={() => setInventoryFilter('low')}>Low Stock Only</button>
        <button className={inventoryFilter === 'out' ? 'active' : ''} onClick={() => setInventoryFilter('out')}>Out of Stock</button>
      </div>
      <DataTable
        columns={[
          { key: 'name', label: 'Product' },
          { key: 'sizeStock', label: 'Size Stock', render: (row) => <div className="size-stock-grid">{['S', 'M', 'L', 'XL'].map((size) => {
            const qty = Number(row.raw.sizeStock?.[size] || 0);
            const level = qty === 0 ? 'out' : qty <= 10 ? 'low' : 'ok';
            return <label key={size} className={`size-stock ${level}`}><span>{size}</span><input type="number" value={qty} onChange={(event) => updateSizeStock(row.raw, size, event.target.value)} /></label>;
          })}</div> },
          { key: 'alert', label: 'Alert' },
          { key: 'actions', label: 'Restock', render: (row) => <button onClick={() => restock(row.id)}>+10 Restock</button> },
        ]}
        rows={filteredInventoryProducts.map((product) => ({ id: product.id || product._id, raw: product, name: product.name, alert: Object.values(product.sizeStock || {}).some((value) => Number(value || 0) === 0) ? 'Out by size' : Object.values(product.sizeStock || {}).some((value) => Number(value || 0) <= 10) ? 'Low stock' : 'Healthy' }))}
      />
    </section>
  );

  const renderFinance = () => (
    <FinanceIntelligence
      finance={finance}
      orders={orders}
      products={products}
      customers={customers}
      expenseForm={expenseForm}
      setExpenseForm={setExpenseForm}
      onSubmitExpense={submitExpense}
    />
  );

  const renderAnalytics = () => (
    <div className="admin-two-col">
      <section className="admin-panel"><div className="admin-section-head"><span>Revenue</span><h2>Revenue Trends</h2></div><ColumnChart data={analytics?.monthlyRevenue || []} /></section>
      <section className="admin-panel"><div className="admin-section-head"><span>Customers</span><h2>Customer Growth</h2></div><ColumnChart data={analytics?.customerGrowth || []} valueKey="customers" /></section>
      <section className="admin-panel"><div className="admin-section-head"><span>Products</span><h2>Product Performance</h2></div><BarChart data={analytics?.productPerformance || []} labelKey="name" /></section>
      <section className="admin-panel"><div className="admin-section-head"><span>Frequency</span><h2>Order Frequency</h2></div><ColumnChart data={analytics?.orderFrequency || []} valueKey="orders" /></section>
    </div>
  );

  const renderBulkOrders = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Wholesale</span><h2>Bulk Customers</h2></div>
        <form className="admin-form compact" onSubmit={submitBulkCustomer}>
          {['name', 'email', 'company', 'discount', 'notes'].map((field) => <label key={field}>{field}<input value={bulkForm[field]} onChange={(e) => setBulkForm((prev) => ({ ...prev, [field]: e.target.value }))} /></label>)}
          <button className="admin-primary" type="submit">Save Bulk Customer</button>
        </form>
      </section>
      <section className="admin-panel"><DataTable columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'company', label: 'Company' }, { key: 'discount', label: 'Discount' }]} rows={bulkCustomers.map((customer) => ({ id: customer._id, ...customer, discount: `${customer.discount || 0}%` }))} /></section>
    </>
  );

  const renderInvoices = () => (
    <section className="admin-panel">
      <div className="admin-section-head"><span>Documents</span><h2>Invoices</h2></div>
      <DataTable
        columns={[
          { key: 'order', label: 'Order' },
          { key: 'customer', label: 'Customer' },
          { key: 'total', label: 'Total' },
          { key: 'actions', label: 'Invoice', render: (row) => <button onClick={() => printInvoice(row.raw)}>Print / PDF</button> },
        ]}
        rows={orders.map((order) => ({ id: order._id, raw: order, order: order._id.slice(-6), customer: order.user?.name || order.address?.fullName || 'Customer', total: money(order.totalPrice) }))}
      />
    </section>
  );

  const renderCMS = () => <AdminVisualCmsEmbed />;

  const renderSettings = () => (
    <>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Payment</span><h2>Payment Settings</h2></div>
        <form className="admin-form compact" onSubmit={saveSettings}>
          <label>
            Provider
            <input
              value={settings.paymentProvider || 'PayHere'}
              onChange={(event) => setSettings((prev) => ({ ...prev, paymentProvider: event.target.value }))}
            />
          </label>
          <label>
            Merchant ID
            <input
              value={settings.merchantId || ''}
              onChange={(event) => setSettings((prev) => ({ ...prev, merchantId: event.target.value }))}
              placeholder="PayHere merchant id"
            />
          </label>
          <label>
            Merchant Secret
            <input
              type="password"
              value={settings.merchantSecret || ''}
              onChange={(event) => setSettings((prev) => ({ ...prev, merchantSecret: event.target.value }))}
              placeholder={settings.hasMerchantSecret ? 'Saved - enter only to replace' : 'PayHere merchant secret'}
            />
          </label>
          <label>
            Currency
            <input
              value={settings.currency || 'LKR'}
              onChange={(event) => setSettings((prev) => ({ ...prev, currency: event.target.value }))}
            />
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={Boolean(settings.enableCOD)}
              onChange={(event) => setSettings((prev) => ({ ...prev, enableCOD: event.target.checked }))}
            />
            Enable Cash on Delivery
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={Boolean(settings.enableOnlinePayment)}
              onChange={(event) => setSettings((prev) => ({ ...prev, enableOnlinePayment: event.target.checked }))}
            />
            Enable Online Payment
          </label>
          <button className="admin-primary" type="submit">Save Payment Settings</button>
        </form>
        <p className="admin-muted">Merchant secret is stored on the backend only and is never returned to the browser.</p>
      </section>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Site</span><h2>Site Settings</h2></div>
        <form className="admin-form compact" onSubmit={saveSettings}>
          <label>Store Name<input value={settings.storeName || ''} onChange={(e) => setSettings((prev) => ({ ...prev, storeName: e.target.value }))} /></label>
          <label>Logo URL<input value={settings.logoUrl || ''} onChange={(e) => setSettings((prev) => ({ ...prev, logoUrl: e.target.value }))} /></label>
          <label>
            WhatsApp Number
            <input
              value={settings.whatsappNumber || ''}
              onChange={(event) => setSettings((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
              placeholder="94770000000"
            />
          </label>
          <label>Contact Email<input value={settings.contactEmail || ''} onChange={(e) => setSettings((prev) => ({ ...prev, contactEmail: e.target.value }))} /></label>
          <button className="admin-primary" type="submit">Save Site Settings</button>
        </form>
        <p className="admin-muted">Admin routes are protected by JWT authentication and require the user role to be admin.</p>
        <p className="admin-muted">Current API base: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</p>
      </section>
    </>
  );

  const renderActive = () => {
    if (active === 'Products') return renderProducts();
    if (active === 'Orders') return renderOrders();
    if (active === 'Customers') return renderCustomers();
    if (active === 'Inventory') return renderInventory();
    if (active === 'Finance') return renderFinance();
    if (active === 'Analytics') return renderAnalytics();
    if (active === 'Bulk Orders') return renderBulkOrders();
    if (active === 'Invoices') return renderInvoices();
    if (active === 'CMS') return renderCMS();
    if (active === 'Settings') return renderSettings();
    return renderDashboard();
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">ATELIER<span>Admin</span></div>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={active === item ? 'active' : ''}
              onClick={() => {
                if (item === 'CMS') {
                  setActive('CMS');
                  navigate('/admin/cms');
                } else {
                  setActive(item);
                  if (location.pathname.startsWith('/admin/cms')) navigate('/admin');
                }
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
      <main className={active === 'CMS' ? 'admin-main is-cms' : 'admin-main'}>
        {active !== 'CMS' && (
          <header className="admin-topbar">
            <div><span className="admin-eyebrow">Business Management</span><h1>{active}</h1></div>
            <div className="admin-top-note">SS26 Operations</div>
          </header>
        )}
        {active !== 'CMS' && error && <p className="admin-alert error">{error}</p>}
        {active !== 'CMS' && message && <p className="admin-alert success">{message}</p>}
        {renderActive()}
      </main>
    </div>
  );
}
