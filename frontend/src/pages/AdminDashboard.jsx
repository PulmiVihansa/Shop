import { useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../services/api.js';
import InventoryManagementPanel from '../components/admin/InventoryManagementPanel.jsx';
import '../styles/admin.css';

const money = (value) => `LKR${Number(value || 0).toLocaleString()}`;
const SIZE_SET = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const newSizeStock = () => ({ XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 });

const makeEmptyProduct = () => ({
  name: '',
  price: '',
  description: '',
  category: '',
  sizeStock: newSizeStock(),
  tags: '',
  swatches: '',
  bgClass: 'b1',
  imageClass: 'linen',
  badge: '',
  badgeText: '',
  images: [],
});

const emptyExpense = { title: '', category: 'Material cost', amount: '' };
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
  const [active, setActive] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [finance, setFinance] = useState(null);
  const [bulkCustomers, setBulkCustomers] = useState([]);
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
    whatsappNumber: '',
  });
  const [productForm, setProductForm] = useState(makeEmptyProduct);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [bulkForm, setBulkForm] = useState(emptyBulkCustomer);
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAdminData = async () => {
    const [productRes, orderRes, userRes, analyticsRes, financeRes, bulkRes, settingsRes, homepageRes, bannerRes, siteRes] = await Promise.all([
      api.get('/products'),
      api.get('/orders'),
      api.get('/users'),
      api.get('/analytics'),
      api.get('/finance', { params: { category: expenseFilter === 'all' ? undefined : expenseFilter } }),
      api.get('/bulk-orders/customers'),
      api.get('/settings/payment'),
      api.get('/content/homepage'),
      api.get('/content/banners'),
      api.get('/settings'),
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
  };

  useEffect(() => {
    loadAdminData().catch((err) => setError(getErrorMessage(err)));
  }, [expenseFilter]);

  const totals = analytics?.totals || {
    users: customers.length,
    orders: orders.length,
    revenue: orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    lowStock: products.filter((product) => Number(product.stock || 0) > 0 && Number(product.stock || 0) < 15).length,
  };

  const calculatedTotalStock = useMemo(
    () => SIZE_SET.reduce((sum, size) => sum + Number(productForm.sizeStock?.[size] || 0), 0),
    [productForm.sizeStock]
  );

  const productPayload = {
    ...productForm,
    price: Number(productForm.price || 0),
    stock: calculatedTotalStock,
    sizes: SIZE_SET,
    sizeStock: SIZE_SET.reduce((acc, size) => {
      acc[size] = Math.max(0, Math.trunc(Number(productForm.sizeStock?.[size] || 0)));
      return acc;
    }, {}),
    tags: productForm.tags.split(',').map((item) => item.trim()).filter(Boolean),
    swatches: productForm.swatches.split(',').map((item) => item.trim()).filter(Boolean),
    images: productForm.images.map((item) => item.trim()).filter(Boolean),
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
      setProductForm(makeEmptyProduct());
      setEditingId(null);
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const editProduct = (product) => {
    setActive('Products');
    setEditingId(product.id || product._id);
    const incomingSizeStock = product.sizeStock || {};
    setProductForm({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      category: product.category || '',
      sizeStock: SIZE_SET.reduce((acc, size) => {
        acc[size] = Number(incomingSizeStock[size] || 0);
        return acc;
      }, newSizeStock()),
      tags: product.tags?.join(', ') || '',
      swatches: product.swatches?.join(', ') || '',
      images: product.images?.length ? product.images : [],
      bgClass: product.bgClass || 'b1',
      imageClass: product.imageClass || 'linen',
      badge: product.badge || '',
      badgeText: product.badgeText || '',
    });
  };

  const duplicateProduct = async (product) => {
    try {
      const payload = {
        name: `${product.name} Copy`,
        price: Number(product.price || 0),
        description: product.description || '',
        category: product.category || '',
        sizeStock: SIZE_SET.reduce((acc, size) => {
          acc[size] = Number(product.sizeStock?.[size] || 0);
          return acc;
        }, newSizeStock()),
        stock: SIZE_SET.reduce((sum, size) => sum + Number(product.sizeStock?.[size] || 0), 0),
        sizes: SIZE_SET,
        tags: product.tags || [],
        swatches: product.swatches || [],
        images: product.images || [],
        bgClass: product.bgClass || 'b1',
        imageClass: product.imageClass || 'linen',
        badge: product.badge || '',
        badgeText: product.badgeText || '',
      };
      await api.post('/products', payload);
      await loadAdminData();
      setMessage('Product duplicated');
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);
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
      const tags = (product.tags || []).join(' ').toLowerCase();
      return (
        String(product.name || '').toLowerCase().includes(query) ||
        String(product.category || '').toLowerCase().includes(query) ||
        tags.includes(query)
      );
    });
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = String(order.user?.name || order.address?.fullName || '').toLowerCase();
      const email = String(order.user?.email || '').toLowerCase();
      const orderId = String(order._id || '').toLowerCase();
      const paymentStatus = String(order.paymentStatus || order.payment?.status || '').toLowerCase();
      const status = String(order.status || '').toLowerCase();
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;

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
    const countBy = (value) => source.filter((order) => String(order.status || '').toLowerCase() === value).length;
    return {
      total: source.length,
      pending: countBy('pending'),
      processing: countBy('processing'),
      shipped: countBy('shipped'),
      delivered: countBy('delivered'),
      cancelled: countBy('cancelled'),
      revenue: source.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0),
    };
  }, [filteredOrders]);

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
      await api.put(`/orders/${id}/payment-status`, { paymentStatus });
      await loadAdminData();
      setMessage(`Payment status updated to ${paymentStatus}`);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const orderTimeline = (order) => {
    const created = order.createdAt ? new Date(order.createdAt) : new Date();
    const updated = order.updatedAt ? new Date(order.updatedAt) : created;
    return [
      { label: 'Order Placed', time: created },
      { label: 'Payment Confirmed', time: String(order.paymentStatus || '').toLowerCase() === 'paid' ? created : null },
      { label: 'Processing', time: ['processing', 'shipped', 'delivered'].includes(String(order.status || '').toLowerCase()) ? updated : null },
      { label: 'Shipped', time: ['shipped', 'delivered'].includes(String(order.status || '').toLowerCase()) ? updated : null },
      { label: 'Delivered', time: String(order.status || '').toLowerCase() === 'delivered' ? updated : null },
    ];
  };

  const getProductImage = (item) => {
    const product = products.find((entry) => (entry.id || entry._id) === item.product);
    return product?.images?.[0] || '';
  };

  const renderDashboard = () => (
    <>
      <div className="admin-metrics">
        <MetricCard label="Total Users" value={totals.users} note="Registered accounts" />
        <MetricCard label="Total Orders" value={totals.orders} note="All order statuses" />
        <MetricCard label="Total Revenue" value={money(totals.revenue)} note="Gross sales" />
        <MetricCard label="Low Stock Alerts" value={totals.lowStock} note="Below 15 units" />
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
        <div className="admin-section-head"><span>Catalog Studio</span><h2>{editingId ? 'Edit Product' : 'Create Product'}</h2></div>
        <form className="admin-form" onSubmit={submitProduct}>
          {[
            ['name', 'Name'],
            ['price', 'Price'],
            ['description', 'Description'],
            ['category', 'Category'],
            ['tags', 'Tags (new, sale, featured)'],
            ['swatches', 'Colors / Swatches'],
            ['badge', 'Badge'],
            ['bgClass', 'Background class'],
            ['imageClass', 'Image class'],
            ['badgeText', 'Badge text'],
          ].map(([name, label]) => (
              <label key={name}>{label}<input name={name} value={productForm[name]} onChange={(e) => setProductForm((prev) => ({ ...prev, [name]: e.target.value }))} /></label>
          ))}
          <div className="admin-size-stock-editor">
            <h3>Size Stock</h3>
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
          <button className="admin-primary" type="submit">{editingId ? 'Update Product' : 'Create Product'}</button>
        </form>
      </section>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Product Management</span><h2>Product List</h2></div>
        <div className="admin-inline-search">
          <input
            placeholder="Search by product name, category, or tag"
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
          />
        </div>
        <DataTable
          columns={[
            { key: 'image', label: 'Image', render: (row) => <div className="admin-mini-image">{row.image ? <img src={row.image} alt={row.name} /> : <span>No Image</span>}</div> },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            { key: 'price', label: 'Price' },
            { key: 'stock', label: 'Stock' },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => editProduct(row.raw)}>Edit</button><button onClick={() => duplicateProduct(row.raw)}>Duplicate</button><button onClick={() => setProductPreview(row.raw)}>Preview</button><button onClick={() => deleteProduct(row.id)}>Delete</button></div> },
          ]}
          rows={filteredProducts.map((product) => ({ id: product.id || product._id, raw: product, image: product.images?.[0] || '', name: product.name, category: product.category, price: money(product.price), stock: product.stock }))}
        />
      </section>
      {productPreview && (
        <section className="admin-panel">
          <div className="admin-section-head"><span>Preview</span><h2>{productPreview.name}</h2></div>
          <div className="admin-product-preview">
            <div className="admin-product-preview-image">
              {productPreview.images?.[0] ? <img src={productPreview.images[0]} alt={productPreview.name} /> : <span>No Image</span>}
            </div>
            <div>
              <p>{productPreview.description || 'No description provided.'}</p>
              <p>Category: {productPreview.category || '-'}</p>
              <p>Price: {money(productPreview.price)}</p>
              <p>Total Stock: {productPreview.stock}</p>
              <p>Tags: {(productPreview.tags || []).join(', ') || '-'}</p>
              <button onClick={() => setProductPreview(null)}>Close Preview</button>
            </div>
          </div>
        </section>
      )}
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
            { key: 'customer', label: 'Customer' },
            { key: 'date', label: 'Date' },
            { key: 'items', label: 'Items Count' },
            { key: 'total', label: 'Total' },
            { key: 'paymentStatus', label: 'Payment Status', render: (row) => <span className={`admin-pill ${paymentClass(row.paymentStatus)}`}>{row.paymentStatus.toUpperCase()}</span> },
            { key: 'status', label: 'Order Status', render: (row) => <span className={`admin-pill ${statusClass(row.status)}`}>{row.status.toUpperCase()}</span> },
            { key: 'actions', label: 'Actions', render: (row) => <div className="admin-actions"><button onClick={() => setSelectedOrder(row.raw)}>Open</button><button onClick={() => messageCustomer(row.raw)}>Message</button></div> },
          ]}
          rows={filteredOrders.map((order) => ({
            id: order._id,
            raw: order,
            orderId: String(order._id).slice(-8).toUpperCase(),
            customer: order.user?.name || order.address?.fullName || 'Customer',
            date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-',
            items: order.items.length,
            total: money(order.totalPrice),
            paymentStatus: String(order.paymentStatus || order.payment?.status || 'pending').toLowerCase(),
            status: String(order.status || 'pending').toLowerCase()
          }))}
        />
      </section>
      {selectedOrder && (
        <aside className="admin-order-drawer">
          <button className="admin-close" onClick={() => setSelectedOrder(null)}>Close</button>
          <h3>Order #{String(selectedOrder._id).slice(-8).toUpperCase()}</h3>
          <div className="admin-order-detail-grid">
            <section>
              <h4>Customer Information</h4>
              <p>Name: {selectedOrder.user?.name || selectedOrder.address?.fullName || 'Customer'}</p>
              <p>Email: {selectedOrder.user?.email || '-'}</p>
              <p>Phone: {selectedOrder.address?.phone || '-'}</p>
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
              {selectedOrder.items.map((item) => (
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
            <p>Subtotal: <strong>{money(selectedOrder.totalPrice)}</strong></p>
            <p>Shipping: <strong>{money(0)}</strong></p>
            <p>Discount: <strong>{money(0)}</strong></p>
            <p>Total: <strong>{money(selectedOrder.totalPrice)}</strong></p>
          </section>
          <section className="admin-order-summary">
            <h4>Payment Details</h4>
            <p>Payment Method: <strong>{selectedOrder.paymentMethod || selectedOrder.payment?.method || '-'}</strong></p>
            <p>Transaction ID: <strong>{selectedOrder.transactionId || selectedOrder.payment?.reference || '-'}</strong></p>
            <p>Payment Status: <strong>{String(selectedOrder.paymentStatus || selectedOrder.payment?.status || '-').toUpperCase()}</strong></p>
          </section>
          <section className="admin-order-actions">
            <h4>Admin Actions</h4>
            <div className="admin-actions">
              <button onClick={() => updateStatus(selectedOrder._id, 'processing')}>Mark Processing</button>
              <button onClick={() => updateStatus(selectedOrder._id, 'shipped')}>Mark Shipped</button>
              <button onClick={() => updateStatus(selectedOrder._id, 'delivered')}>Mark Delivered</button>
              <button onClick={() => updateStatus(selectedOrder._id, 'cancelled')}>Cancel Order</button>
              <button onClick={() => updatePaymentStatus(selectedOrder._id, 'REFUNDED')}>Refund</button>
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
    <InventoryManagementPanel
      products={products}
      onRefreshData={loadAdminData}
      currency={settings.currency || 'LKR'}
    />
  );

  const renderFinance = () => (
    <>
      <div className="admin-metrics">
        <MetricCard label="Revenue" value={money(finance?.revenue)} />
        <MetricCard label="Expenses" value={money(finance?.expenses)} />
        <MetricCard label="Profit" value={money(finance?.profit)} />
      </div>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Expenses</span><h2>Add Expense</h2></div>
        <div className="admin-filter-row">
          {['all', 'Material cost', 'Shipping cost', 'Marketing'].map((category) => (
            <button key={category} className={expenseFilter === category ? 'active' : ''} onClick={() => setExpenseFilter(category)}>
              {category}
            </button>
          ))}
        </div>
        <form className="admin-form compact" onSubmit={submitExpense}>
          <label>Title<input value={expenseForm.title} onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
          <label>Category<select value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}><option>Material cost</option><option>Shipping cost</option><option>Marketing</option><option>Other</option></select></label>
          <label>Amount<input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} /></label>
          <button className="admin-primary" type="submit">Save Expense</button>
        </form>
      </section>
      <section className="admin-panel">
        <div className="admin-section-head"><span>Ledger</span><h2>Expense Table</h2></div>
        <DataTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'category', label: 'Category' },
            { key: 'amount', label: 'Amount' },
          ]}
          rows={(finance?.expenseItems || []).map((expense) => ({ id: expense._id, title: expense.title, category: expense.category, amount: money(expense.amount) }))}
        />
      </section>
      <section className="admin-panel"><div className="admin-section-head"><span>Breakdown</span><h2>Expense Breakdown</h2></div><PieChart data={Object.entries(finance?.breakdown || {}).map(([label, amount]) => ({ label, amount }))} valueKey="amount" /></section>
    </>
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
            <label>Featured Categories<input value={(homepageContent.featuredCategories || []).join(', ')} onChange={(e) => setHomepageContent((prev) => ({ ...prev, featuredCategories: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} /></label>
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
        <nav>{menuItems.map((item) => <button key={item} className={active === item ? 'active' : ''} onClick={() => setActive(item)}>{item}</button>)}</nav>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-eyebrow">Business Management</span><h1>{active}</h1></div>
          <div className="admin-top-note">SS26 Operations</div>
        </header>
        {error && <p className="admin-alert error">{error}</p>}
        {message && <p className="admin-alert success">{message}</p>}
        {renderActive()}
      </main>
    </div>
  );
}
