import { useMemo, useState } from 'react';
import {
  TbAlertCircle,
  TbAlertTriangle,
  TbArrowRight,
  TbArrowUpRight,
  TbAward,
  TbBell,
  TbBulb,
  TbCalendar,
  TbChartLine,
  TbCheck,
  TbCirclePlus,
  TbClock,
  TbCurrencyDollar,
  TbDownload,
  TbFileExport,
  TbFileInvoice,
  TbLock,
  TbPackage,
  TbPlus,
  TbReceipt,
  TbReportAnalytics,
  TbSearch,
  TbSend,
  TbShoppingBag,
  TbSpeakerphone,
  TbStar,
  TbTarget,
  TbTrendingUp,
  TbTruck,
  TbX,
} from 'react-icons/tb';
import '../styles/admin-finance.css';

const money = (value) => `LKR ${Number(value || 0).toLocaleString()}`;
const safeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (date, amount) => {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
};

const addMonths = (date, amount) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
};

const percentChange = (previous, current) => {
  const prev = Number(previous || 0);
  const curr = Number(current || 0);
  if (prev === 0 && curr === 0) return 0;
  if (prev === 0) return 100;
  return ((curr - prev) / prev) * 100;
};

const fallbackExpenses = [
  { id: 'e1', title: 'Instagram Campaign SS26', category: 'Marketing', amount: 340000, date: '2026-05-22' },
  { id: 'e2', title: 'Express bulk shipping', category: 'Shipping cost', amount: 214000, date: '2026-05-20' },
  { id: 'e3', title: 'Fabric - Tessuto Milano', category: 'Material cost', amount: 1280000, date: '2026-05-18' },
  { id: 'e4', title: 'Studio rent - May', category: 'Operations', amount: 420000, date: '2026-05-01' },
  { id: 'e5', title: 'Influencer styling fee', category: 'Marketing', amount: 180000, date: '2026-04-30' },
];

const fallbackProducts = [
  { name: 'Black Oversized Hoodie', category: 'Knitwear', price: 28400, stock: 6, revenue: 2840000, margin: 68 },
  { name: 'Ivory Silk Blouse', category: 'Tops', price: 21600, stock: 14, revenue: 2160000, margin: 61 },
  { name: 'Camel Wool Blazer', category: 'Outerwear', price: 34800, stock: 28, revenue: 3480000, margin: 52 },
  { name: 'Wide-Leg Satin Pants', category: 'Bottoms', price: 16200, stock: 62, revenue: 1620000, margin: 46 },
  { name: 'Beige Linen Trench Coat', category: 'Outerwear', price: 26100, stock: 0, revenue: 2610000, margin: 40 },
];

const deadStock = [
  { name: 'Floral Maxi Dress - Dusty Rose', units: 34, sku: 'SKU-0824', days: 87, value: 544000, severity: 'critical' },
  { name: 'Metallic Pleated Skirt', units: 22, sku: 'SKU-0712', days: 74, value: 396000, severity: 'critical' },
  { name: 'Sage Green Linen Shirt', units: 41, sku: 'SKU-0631', days: 58, value: 492000, severity: 'warning' },
  { name: 'Burgundy Velvet Blazer', units: 18, sku: 'SKU-0558', days: 45, value: 402000, severity: 'warning' },
];

const chartSets = {
  monthly: {
    label: 'Last 6 months',
    labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
    revenue: [1280000, 1420000, 1360000, 1580000, 1640000, 1843200],
    expenses: [520000, 580000, 550000, 620000, 640000, 678400],
    profit: [760000, 840000, 810000, 960000, 1000000, 1164800],
  },
  weekly: {
    label: 'Last 6 weeks',
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'Now'],
    revenue: [380000, 420000, 440000, 400000, 480000, 523200],
    expenses: [140000, 152000, 168000, 144000, 162000, 172400],
    profit: [240000, 268000, 272000, 256000, 318000, 350800],
  },
  yearly: {
    label: 'Year over year',
    labels: ['2021', '2022', '2023', '2024', '2025', '2026'],
    revenue: [9400000, 10500000, 11800000, 16200000, 18400000, 22400000],
    expenses: [4200000, 4600000, 5100000, 6300000, 6800000, 7900000],
    profit: [5200000, 5900000, 6700000, 9900000, 11600000, 14500000],
  },
};

function TrendBadge({ value, neutralText }) {
  if (neutralText) {
    return (
      <span className="fin-trend neutral">
        <TbClock /> {neutralText}
      </span>
    );
  }
  const isUp = value >= 0;
  return (
    <span className={`fin-trend ${isUp ? 'up' : 'down'}`}>
      <TbArrowUpRight /> {isUp ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

function MultiLineChart({ data }) {
  const width = 720;
  const height = 220;
  const padX = 26;
  const padY = 18;
  const allValues = [...data.revenue, ...data.expenses, ...data.profit];
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const span = Math.max(1, max - min);

  const pathFor = (values) =>
    values
      .map((value, idx) => {
        const x = padX + (idx / (values.length - 1)) * (width - padX * 2);
        const y = padY + (1 - (value - min) / span) * (height - padY * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

  return (
    <div className="fin-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue expenses and profit trend chart">
        {[0.25, 0.5, 0.75].map((y) => (
          <line key={y} x1="0" x2={width} y1={height * y} y2={height * y} className="fin-grid-line" />
        ))}
        <path d={pathFor(data.revenue)} className="fin-line revenue" />
        <path d={pathFor(data.expenses)} className="fin-line expenses" />
        <path d={pathFor(data.profit)} className="fin-line profit" />
      </svg>
      <div className="fin-axis">
        {data.labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose, narrow }) {
  return (
    <div className="fin-modal-bg" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`fin-modal ${narrow ? 'narrow' : ''}`}>
        <div className="fin-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="fin-icon-button" onClick={onClose} aria-label="Close modal">
            <TbX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FinanceIntelligence({
  finance,
  orders,
  products,
  customers,
  expenseForm,
  setExpenseForm,
  onSubmitExpense,
}) {
  const [period, setPeriod] = useState('May 2026');
  const [chartView, setChartView] = useState('monthly');
  const [modal, setModal] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
  const [toast, setToast] = useState('');
  const [aiWork, setAiWork] = useState(null);

  const expenseItems = safeArray(finance?.expenseItems).length ? safeArray(finance?.expenseItems) : fallbackExpenses;
  const orderRows = safeArray(orders);
  const productRows = safeArray(products).length ? safeArray(products) : fallbackProducts;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const previous = addMonths(now, -1);

  const totals = useMemo(() => {
    const revenueTotal =
      orderRows.length > 0
        ? orderRows.reduce((acc, order) => acc + Number(order?.totalPrice || 0), 0)
        : Number(finance?.revenue || chartSets.monthly.revenue.at(-1));
    const expensesTotal = expenseItems.reduce((acc, item) => acc + Number(item?.amount || 0), 0);
    const profitTotal = revenueTotal - expensesTotal;

    const revenueThisMonth = orderRows
      .filter((order) => {
        const d = normalizeDate(order?.createdAt || order?.date || order?.updatedAt);
        return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((acc, order) => acc + Number(order?.totalPrice || 0), 0);
    const revenuePrevMonth = orderRows
      .filter((order) => {
        const d = normalizeDate(order?.createdAt || order?.date || order?.updatedAt);
        return d && d.getMonth() === previous.getMonth() && d.getFullYear() === previous.getFullYear();
      })
      .reduce((acc, order) => acc + Number(order?.totalPrice || 0), 0);

    const expensesThisMonth = expenseItems
      .filter((item) => {
        const d = normalizeDate(item?.date || item?.createdAt);
        return d && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((acc, item) => acc + Number(item?.amount || 0), 0);
    const expensesPrevMonth = expenseItems
      .filter((item) => {
        const d = normalizeDate(item?.date || item?.createdAt);
        return d && d.getMonth() === previous.getMonth() && d.getFullYear() === previous.getFullYear();
      })
      .reduce((acc, item) => acc + Number(item?.amount || 0), 0);

    return {
      revenueTotal,
      expensesTotal,
      profitTotal,
      targetPct: Math.min(99, Math.round((revenueTotal / Math.max(1, Number(finance?.target || 2360000))) * 100)),
      trends: {
        revenue: percentChange(revenuePrevMonth, revenueThisMonth || revenueTotal),
        expenses: percentChange(expensesPrevMonth, expensesThisMonth || expensesTotal),
        profit: percentChange(revenuePrevMonth - expensesPrevMonth, (revenueThisMonth || revenueTotal) - (expensesThisMonth || expensesTotal)),
      },
    };
  }, [expenseItems, finance?.revenue, finance?.target, orderRows, previous, thisMonth, thisYear]);

  const productIntelligence = useMemo(() => {
    const revenueByProduct = new Map();
    orderRows.forEach((order) => {
      safeArray(order?.items).forEach((item) => {
        const name = item?.name || item?.title || 'Product';
        revenueByProduct.set(name, (revenueByProduct.get(name) || 0) + Number(item?.price || 0) * Number(item?.quantity || 0));
      });
    });

    return productRows
      .map((product, index) => {
        const stockBySize = Object.values(product?.sizeStock || {}).reduce((acc, value) => acc + Number(value || 0), 0);
        const stock = stockBySize || Number(product?.stock || 0);
        const price = Number(product?.price || fallbackProducts[index % fallbackProducts.length]?.price || 0);
        const revenue = revenueByProduct.get(product?.name) || Number(product?.revenue || price * Math.max(1, 100 - index * 12));
        const margin = Number(product?.margin || Math.max(34, 68 - index * 7));
        return {
          name: product?.name || fallbackProducts[index % fallbackProducts.length].name,
          category: product?.category || fallbackProducts[index % fallbackProducts.length].category,
          stock,
          price,
          revenue,
          margin,
          profit: revenue * (margin / 100),
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [orderRows, productRows]);

  const runway = useMemo(() => {
    return productIntelligence
      .slice()
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map((item) => {
        const days = item.stock === 0 ? 0 : Math.max(4, Math.round(item.stock / 1.6));
        const loss = Math.round(item.price * Math.max(8, 32 - days));
        return { ...item, days, loss };
      });
  }, [productIntelligence]);

  const recentExpenses = useMemo(() => {
    return expenseItems
      .map((item) => ({
        ...item,
        amount: Number(item?.amount || 0),
        dateObj: normalizeDate(item?.date || item?.createdAt) || new Date(0),
      }))
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 5);
  }, [expenseItems]);

  const criticalRunway = runway.filter((item) => item.days <= 4).length;
  const exposure = runway.slice(0, 2).reduce((acc, item) => acc + item.loss, 0);
  const target = Number(finance?.target || 2360000);
  const remaining = Math.max(0, target - totals.revenueTotal);
  const healthScore = Math.max(62, Math.min(94, Math.round(78 + totals.trends.revenue / 3 - criticalRunway * 3)));
  const avgDailyRevenue = Math.max(1, Math.round(totals.revenueTotal / Math.max(1, now.getDate())));
  const avgDailyExpense = Math.max(1, Math.round(totals.expensesTotal / Math.max(1, now.getDate())));
  const cashOnHand = Math.max(totals.profitTotal + 900000, 350000);
  const cashRunwayDays = Math.max(7, Math.round(cashOnHand / avgDailyExpense));
  const recoveryPotential = deadStock.reduce((acc, item) => acc + item.value, 0) * 0.72;
  const overdueInvoices = Math.max(3, Math.round(safeArray(customers).length / 18) || 3);
  const invoiceValue = overdueInvoices * 142000;
  const budgetLimit = Math.max(totals.revenueTotal * 0.42, totals.expensesTotal * 1.12);
  const budgetUsedPct = Math.min(100, Math.round((totals.expensesTotal / budgetLimit) * 100));
  const actionPlan = [
    {
      title: 'Collect customer payments',
      detail: `${overdueInvoices} unpaid payments. Send WhatsApp reminders today.`,
      impact: money(invoiceValue),
      tone: 'blue',
      icon: TbFileInvoice,
    },
    {
      title: 'Order fast-moving stock',
      detail: `${productIntelligence[0]?.name || 'Top product'} is selling well. Do not let it finish.`,
      impact: money(exposure),
      tone: 'red',
      icon: TbPackage,
    },
    {
      title: 'Sell old stock faster',
      detail: 'Make a small discount bundle for items sitting more than 45 days.',
      impact: money(recoveryPotential),
      tone: 'amber',
      icon: TbBulb,
    },
  ];

  const aiJobs = [
    {
      id: 'payments',
      title: 'Prepare payment reminders',
      text: 'Writes polite WhatsApp messages for unpaid customer payments.',
      icon: TbFileInvoice,
    },
    {
      id: 'reorder',
      title: 'Prepare supplier order',
      text: 'Creates a reorder list and supplier message for low stock.',
      icon: TbPackage,
    },
    {
      id: 'sale',
      title: 'Make old-stock sale plan',
      text: 'Suggests simple bundles and discount wording for slow items.',
      icon: TbBulb,
    },
    {
      id: 'daily',
      title: "Build today's task list",
      text: 'Turns finance alerts into a short owner checklist.',
      icon: TbCheck,
    },
  ];

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const copyText = async (text, message = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text);
      notify(message);
    } catch {
      notify('Text is ready to copy');
    }
  };

  const runAiJob = (jobId) => {
    const topProduct = productIntelligence[0];
    const lowStock = runway.slice(0, 3);
    const oldStock = deadStock.slice(0, 3);

    const jobs = {
      payments: {
        title: 'Payment reminders ready',
        subtitle: 'Copy these and send by WhatsApp to customers who still need to pay.',
        items: [
          {
            label: 'Friendly reminder',
            body: `Hi, this is a kind reminder from Maison. Your payment of ${money(Math.round(invoiceValue / overdueInvoices))} is still pending. Please settle it today if possible. Thank you.`,
          },
          {
            label: 'Second reminder',
            body: `Hi, we are following up on your pending shop payment. Please send the payment confirmation when done so we can update our records. Amount due: ${money(Math.round(invoiceValue / overdueInvoices))}.`,
          },
          {
            label: 'Owner note',
            body: `Collect ${money(invoiceValue)} from ${overdueInvoices} unpaid payments before making new non-urgent purchases.`,
          },
        ],
      },
      reorder: {
        title: 'Supplier order prepared',
        subtitle: "Send this to your supplier or use it as today's buying list.",
        items: [
          {
            label: 'Reorder list',
            body: lowStock.map((item) => `${item.name}: order ${item.stock === 0 ? 80 : 50} pcs (${item.stock} left)`).join('\n'),
          },
          {
            label: 'Supplier message',
            body: `Hi, please prepare a restock quotation for:\n${lowStock.map((item) => `- ${item.name}: ${item.stock === 0 ? 80 : 50} pcs`).join('\n')}\nPlease confirm best price and earliest delivery date.`,
          },
          {
            label: 'Why now',
            body: `These products may lose about ${money(exposure)} in sales if not restocked soon.`,
          },
        ],
      },
      sale: {
        title: 'Old-stock sale plan ready',
        subtitle: 'Use this to move stock that is holding shop money.',
        items: [
          {
            label: 'Bundle idea',
            body: oldStock.map((item) => `${item.name}: bundle with a fast-moving top or offer 10-15% off`).join('\n'),
          },
          {
            label: 'Customer message',
            body: `Weekend offer at Maison: selected pieces are available as limited bundles. Message us today for sizes and prices. Offer valid while stock lasts.`,
          },
          {
            label: 'Expected result',
            body: `Recover around ${money(recoveryPotential)} from old stock over the next 30 days if promoted weekly.`,
          },
        ],
      },
      daily: {
        title: "Today's owner task list",
        subtitle: 'A simple work list for the shop owner or manager.',
        items: [
          {
            label: 'Morning',
            body: `1. Check cash in hand: ${money(cashOnHand)}\n2. Send payment reminders for ${overdueInvoices} pending payments\n3. Confirm stock count for ${lowStock[0]?.name || 'top product'}`,
          },
          {
            label: 'Afternoon',
            body: `1. Ask supplier for reorder prices\n2. Post one old-stock bundle offer\n3. Record any spending before closing`,
          },
          {
            label: 'Before closing',
            body: `Check today's sales, spending, and unpaid payments. Keep spending below ${money(Math.max(0, budgetLimit - totals.expensesTotal))} for this month.`,
          },
        ],
      },
    };

    setAiWork(jobs[jobId]);
    setModal('ai');
  };

  const openExpenseModal = () => {
    setExpenseForm((prev) => ({
      ...prev,
      title: prev?.title || '',
      amount: prev?.amount || '',
      date: prev?.date || new Date().toISOString().slice(0, 10),
      category: prev?.category || 'Marketing',
    }));
    setModal('expense');
  };

  const submitExpenseModal = async (event) => {
    await onSubmitExpense(event);
    setModal(null);
    notify('Expense saved successfully');
  };

  return (
    <div className="fin-page">
      <header className="fin-toolbar">
        <div>
          <span className="fin-eyebrow">Shop Money</span>
          <h2>Today&apos;s money, stock, and payments</h2>
        </div>
        <div className="fin-toolbar-actions">
          <div className="fin-periods" aria-label="Period selector">
            {['Q1', 'Q2', 'May 2026', 'YTD'].map((item) => (
              <button key={item} type="button" className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>
                {item}
              </button>
            ))}
          </div>
          <button type="button" className="fin-icon-button" aria-label="Search">
            <TbSearch />
          </button>
          <button type="button" className="fin-icon-button" aria-label="Notifications">
            <TbBell />
          </button>
          <button type="button" className="fin-button ghost" onClick={() => setModal('export')}>
            <TbFileExport /> Export
          </button>
          <button type="button" className="fin-button primary" onClick={openExpenseModal}>
            <TbPlus /> Add Spending
          </button>
        </div>
      </header>

      {showAlert && (
        <section className="fin-alert">
          <div className="fin-alert-icon">
            <TbAlertTriangle />
          </div>
          <p>
            <strong>{criticalRunway || 2} items need attention.</strong> Best-selling stock is low. Reorder now to avoid losing about {money(exposure)} in sales.
          </p>
          <button type="button" className="fin-alert-action" onClick={() => setModal('restock')}>
            Reorder Now
          </button>
          <button type="button" className="fin-dismiss" onClick={() => setShowAlert(false)} aria-label="Dismiss alert">
            <TbX />
          </button>
        </section>
      )}

      <section className="fin-kpi-grid">
        {[
          { label: 'Total Revenue', value: money(totals.revenueTotal), trend: totals.trends.revenue, icon: TbTrendingUp, tone: 'gold' },
          { label: 'Money Spent', value: money(totals.expensesTotal), trend: totals.trends.expenses, icon: TbReceipt, tone: 'red' },
          { label: 'Profit Left', value: money(totals.profitTotal), trend: totals.trends.profit, icon: TbCurrencyDollar, tone: 'green' },
          { label: 'Monthly Goal', value: `${totals.targetPct}%`, neutralText: 'On track', icon: TbTarget, tone: 'blue' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article className="fin-kpi" key={card.label}>
              <div className={`fin-accent ${card.tone}`} />
              <div className="fin-kpi-top">
                <span>{card.label}</span>
                <div className={`fin-kpi-icon ${card.tone}`}>
                  <Icon />
                </div>
              </div>
              <strong>{card.value}</strong>
              <div className="fin-kpi-foot">
                <TrendBadge value={card.trend || 0} neutralText={card.neutralText} />
                <span>{card.neutralText ? `Est. ${addDays(now, 13).toLocaleDateString()}` : 'vs last month'}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="fin-focus-row">
        <div className="fin-focus-panel">
          <div className="fin-focus-label">
            <span /> Today&apos;s simple checklist
          </div>
          <h3>Do these first to keep the shop healthy.</h3>
          <div className="fin-focus-grid">
            <div className="fin-focus-item good">
              <TbChartLine />
              <p>Sales are up <strong>{Math.max(0, totals.trends.revenue).toFixed(0)}%</strong>. Keep promoting what is already selling.</p>
            </div>
            <div className="fin-focus-item good">
              <TbStar />
              <p><strong>{productIntelligence[0]?.name}</strong> gives the best profit. Keep this item available.</p>
            </div>
            <div className="fin-focus-item danger">
              <TbAlertCircle />
              <p><strong>{criticalRunway || 2} items</strong> may run out soon. Reorder before customers ask for them.</p>
            </div>
            <div className="fin-focus-item warning">
              <TbLock />
              <p><strong>{money(deadStock.reduce((acc, item) => acc + item.value, 0))}</strong> is stuck in old stock. Try a bundle or discount.</p>
            </div>
            <div className="fin-focus-item info full">
              <TbCalendar />
              <p>You have finished {totals.targetPct}% of the monthly target. Need about <strong>{money(Math.ceil(remaining / 9))}/day</strong>.</p>
            </div>
          </div>
          <div className="fin-focus-actions">
            <button type="button" className="fin-button primary" onClick={() => setModal('restock')}>
              <TbPackage /> Restock Now
            </button>
            <button type="button" className="fin-button ghost" onClick={openExpenseModal}>
              <TbPlus /> Add Spending
            </button>
          </div>
        </div>

        <aside className="fin-health-card">
          <div className="fin-score-ring" style={{ '--score': healthScore }}>
            <svg viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" />
              <circle cx="45" cy="45" r="38" />
            </svg>
            <div>
              <strong>{healthScore}</strong>
              <span>Score</span>
            </div>
          </div>
          <h3>{healthScore >= 82 ? 'Good' : 'Okay'}</h3>
          <p>A simple shop health score based on sales, spending, stock, and unpaid payments.</p>
          {[
            ['Sales', 'Good', 'good'],
            ['Profit', 'Good', 'good'],
            ['Cash in hand', 'Check', 'warn'],
            ['Old stock', 'Needs work', 'danger'],
            ['Unpaid payments', `${Math.max(1, Math.round(safeArray(customers).length / 20) || 3)} Pending`, 'danger'],
          ].map(([label, value, tone]) => (
            <div className="fin-health-row" key={label}>
              <span>{label}</span>
              <strong className={tone}>{value}</strong>
            </div>
          ))}
        </aside>
      </section>

      <section className="fin-main-grid">
        <article className="fin-panel fin-chart-panel">
          <div className="fin-panel-head">
            <div>
              <span className="fin-eyebrow">Money Movement</span>
              <h3>Sales, spending, and profit</h3>
            </div>
            <div className="fin-tabs">
              {['weekly', 'monthly', 'yearly'].map((item) => (
                <button key={item} type="button" className={chartView === item ? 'active' : ''} onClick={() => setChartView(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="fin-chart-legend">
            <span><i className="revenue" /> Revenue</span>
            <span><i className="expenses" /> Spending</span>
            <span><i className="profit" /> Profit</span>
            <em>{chartSets[chartView].label}</em>
          </div>
          <MultiLineChart data={chartSets[chartView]} />
          <div className="fin-stat-strip">
            <div><span>Avg Monthly Rev</span><strong>{money(1524400)}</strong></div>
            <div><span>Spend Level</span><strong>36.8%</strong></div>
            <div><span>Best Month</span><strong>May 2026</strong></div>
          </div>
        </article>

        <aside className="fin-panel fin-leaks">
          <div className="fin-leak-count">{Math.max(4, criticalRunway + 2)}</div>
          <p>places where money may be lost this month</p>
          <h3>Money Loss Alerts</h3>
          {runway.slice(0, 4).map((item, index) => (
            <div className="fin-leak-item" key={item.name}>
              <div className={`fin-leak-icon ${item.days <= 4 ? 'danger' : index === 2 ? 'warn' : 'info'}`}>
                {item.days <= 4 ? <TbAlertCircle /> : index === 2 ? <TbFileInvoice /> : <TbTruck />}
              </div>
              <div>
                <strong>{item.days === 0 ? 'Best seller is out of stock' : item.days <= 4 ? 'Fast seller is almost finished' : 'Check this item soon'}</strong>
                <span>{item.name} - {item.stock} units</span>
              </div>
              <em>{money(item.loss)}</em>
            </div>
          ))}
          <div className="fin-exposure">
            <strong>Possible lost sales:</strong> {money(exposure)} - fix the top 2 first.
          </div>
        </aside>
      </section>

      <div className="fin-section-divider"><span /> Owner Daily Desk <span /></div>

      <section className="fin-ai-panel">
        <div className="fin-panel-head">
          <div>
            <span className="fin-eyebrow">AI Shop Assistant</span>
            <h3>Let AI prepare the work for you</h3>
          </div>
          <p>No complicated reports. Pick a task and the assistant writes the message, list, or plan.</p>
        </div>
        <div className="fin-ai-grid">
          {aiJobs.map((job) => {
            const Icon = job.icon;
            return (
              <button type="button" className="fin-ai-job" key={job.id} onClick={() => runAiJob(job.id)}>
                <Icon />
                <span>
                  <strong>{job.title}</strong>
                  <em>{job.text}</em>
                </span>
                <TbArrowRight />
              </button>
            );
          })}
        </div>
      </section>

      <section className="fin-decision-grid">
        <article className="fin-panel fin-cash-card">
          <div className="fin-panel-head compact">
            <h3>Cash In Hand</h3>
            <strong className={cashRunwayDays < 21 ? 'fin-critical-pill' : 'fin-blue-label'}>{cashRunwayDays} days safe</strong>
          </div>
          <div className="fin-runway-meter">
            <i style={{ width: `${Math.min(100, (cashRunwayDays / 60) * 100)}%` }} />
          </div>
          <div className="fin-cash-metrics">
            <div><span>Available</span><strong>{money(cashOnHand)}</strong></div>
            <div><span>Daily Spending</span><strong>{money(avgDailyExpense)}</strong></div>
            <div><span>Daily Sales</span><strong>{money(avgDailyRevenue)}</strong></div>
          </div>
          <p>If this drops below 21 days, delay non-urgent buying and collect unpaid customer payments first.</p>
        </article>

        <article className="fin-panel fin-action-plan">
          <div className="fin-panel-head compact">
            <h3>What To Do Today</h3>
            <button
              type="button"
              onClick={() =>
                copyText(
                  actionPlan.map((action, index) => `${index + 1}. ${action.title} - ${action.detail}`).join('\n'),
                  'Today plan copied'
                )
              }
            >
              Copy list
            </button>
          </div>
          {actionPlan.map((action) => {
            const Icon = action.icon;
            return (
              <div className="fin-action-row" key={action.title}>
                <div className={`fin-action-icon ${action.tone}`}><Icon /></div>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.detail}</span>
                </div>
                <em>{action.impact}</em>
              </div>
            );
          })}
        </article>

        <article className="fin-panel fin-budget-card">
          <div className="fin-panel-head compact">
            <h3>Spending Limit</h3>
            <strong className={budgetUsedPct > 86 ? 'fin-critical-pill' : 'fin-blue-label'}>{budgetUsedPct}% used</strong>
          </div>
          <div className="fin-budget-ring" style={{ '--budget': budgetUsedPct }}>
            <svg viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" />
              <circle cx="45" cy="45" r="38" />
            </svg>
            <strong>{budgetUsedPct}%</strong>
          </div>
          <div className="fin-budget-lines">
            <div><span>Can Spend</span><strong>{money(budgetLimit)}</strong></div>
            <div><span>Left</span><strong>{money(Math.max(0, budgetLimit - totals.expensesTotal))}</strong></div>
          </div>
        </article>
      </section>

      <div className="fin-section-divider"><span /> Stock And Product Money <span /></div>

      <section className="fin-three-col">
        <article className="fin-panel">
          <div className="fin-panel-head compact">
            <h3>Best Profit Items</h3>
            <button type="button"><TbArrowRight /> View all</button>
          </div>
          <div className="fin-product-list">
            {productIntelligence.slice(0, 5).map((item, index) => (
              <div className="fin-product-row" key={item.name}>
                <div className={`fin-rank ${index < 3 ? `top-${index + 1}` : ''}`}>{index + 1}</div>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.category} - {money(item.revenue)} rev</span>
                </div>
                <em>{money(item.profit)}</em>
                <div className="fin-margin"><i style={{ width: `${item.margin}%` }} />{item.margin}%</div>
              </div>
            ))}
          </div>
        </article>

        <article className="fin-panel">
          <div className="fin-panel-head compact">
            <h3>Old Stock</h3>
          </div>
          <div className="fin-dead-summary">
            <div><strong>{money(deadStock.reduce((acc, item) => acc + item.value, 0))}</strong><span>Capital Locked</span></div>
            <div><strong>{deadStock.length}</strong><span>Products</span></div>
          </div>
          {deadStock.map((item) => (
            <div className="fin-dead-row" key={item.sku}>
              <span className={item.severity}>{item.days} days</span>
              <div><strong>{item.name}</strong><em>{item.units} units - {item.sku}</em></div>
              <b>{money(item.value)}</b>
            </div>
          ))}
          <div className="fin-tip"><TbBulb /> A small sale or bundle can bring back about {money(1400000)} in 30 days.</div>
        </article>

        <article className="fin-panel">
          <div className="fin-panel-head compact">
            <h3>Stock Left</h3>
            <strong className="fin-critical-pill">{criticalRunway || 2} Critical</strong>
          </div>
          {runway.map((item) => (
            <div className="fin-runway-row" key={item.name}>
              <div>
                <strong>{item.name}</strong>
                <span className={item.days <= 4 ? 'danger' : item.days <= 10 ? 'warn' : 'good'}>
                  {item.days === 0 ? 'OUT OF STOCK' : `~${item.days} days left`} - {item.stock} units
                </span>
              </div>
              <em className={item.days > 20 ? 'good' : ''}>{item.days > 20 ? 'Safe' : money(item.loss)}</em>
              <div className="fin-runway-bar"><i style={{ width: `${Math.min(100, item.stock * 2)}%` }} /></div>
            </div>
          ))}
        </article>
      </section>

      <div className="fin-section-divider"><span /> Goals, Spending, Recent Activity <span /></div>

      <section className="fin-three-col">
        <article className="fin-panel">
          <div className="fin-panel-head compact">
            <h3>Monthly Goal</h3>
            <strong className="fin-blue-label">On Track</strong>
          </div>
          <div className="fin-target-card">
            <strong>{totals.targetPct}<span>%</span></strong>
            <p>of {money(target)} goal - {money(remaining)} still needed</p>
            <div><i style={{ width: `${totals.targetPct}%` }} /></div>
          </div>
          <div className="fin-mini-grid">
            <div><strong>{money(totals.revenueTotal)}</strong><span>Sales so far</span></div>
            <div><strong>{money(remaining)}</strong><span>Still needed</span></div>
            <div><strong>{addDays(now, 13).toLocaleDateString()}</strong><span>Expected close</span></div>
            <div><strong>{money(Math.ceil(remaining / 9))}</strong><span>Needed per day</span></div>
          </div>
        </article>

        <article className="fin-panel">
          <div className="fin-panel-head compact">
            <h3>Spending</h3>
          </div>
          <button type="button" className="fin-add-expense" onClick={openExpenseModal}>
            <TbCirclePlus />
            <span><strong>Add Spending</strong><em>Record money paid out</em></span>
          </button>
          {recentExpenses.map((item) => (
            <div className="fin-expense-row" key={item.id || item._id || `${item.title}-${item.date}`}>
              <span>{item.category}</span>
              <strong>{item.title}</strong>
              <em>{item.dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</em>
              <b>{money(item.amount)}</b>
            </div>
          ))}
          <div className="fin-expense-total"><span>Total spent this month</span><strong>{money(totals.expensesTotal)}</strong></div>
        </article>

        <article className="fin-panel">
          <div className="fin-panel-head compact">
            <h3>Recent Money Activity</h3>
            <button type="button">View all <TbArrowRight /></button>
          </div>
          <div className="fin-timeline">
            {[
              [TbShoppingBag, 'Customer order paid', 'Premium order bundle', `+${money(productIntelligence[0]?.price * 3)}`, 'Today 11:22', 'pos'],
              [TbTruck, 'Supplier paid', 'Autumn fabric deposit', `-${money(1280000)}`, 'Yesterday', 'neg'],
              [TbPackage, 'New stock arrived', '120 items added', 'Stock +120', 'May 22', 'neutral'],
              [TbSpeakerphone, 'Ad campaign paid', 'Social media promotion', `-${money(340000)}`, 'May 22', 'neg'],
              [TbAward, 'Sales target milestone', 'Good sales progress this month', 'Milestone', 'May 21', 'pos'],
            ].map(([Icon, title, desc, amount, time, tone]) => (
              <div className="fin-timeline-item" key={title}>
                <div className={`fin-timeline-node ${tone}`}><Icon /></div>
                <strong>{title}</strong>
                <span>{desc}</span>
                <p><em className={tone}>{amount}</em><b>{time}</b></p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="fin-quick-actions">
        <button type="button" onClick={openExpenseModal}><TbPlus /><span><strong>Add Spending</strong><em>Record money paid out</em></span></button>
        <button type="button" onClick={() => setModal('export')}><TbFileExport /><span><strong>Download Report</strong><em>Simple finance summary</em></span></button>
        <button type="button" onClick={() => notify('Monthly summary generated')}><TbReportAnalytics /><span><strong>Monthly Summary</strong><em>Plain summary for {period}</em></span></button>
      </section>

      {modal === 'expense' && (
        <Modal title="Add Spending" subtitle="Record money paid from the shop" onClose={() => setModal(null)}>
          <form className="fin-modal-form" onSubmit={submitExpenseModal}>
            <label>What was paid for?<input value={expenseForm.title} onChange={(e) => setExpenseForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Instagram ad, fabric payment, delivery..." required /></label>
            <label>Category<select value={expenseForm.category} onChange={(e) => setExpenseForm((prev) => ({ ...prev, category: e.target.value }))}><option>Marketing</option><option>Shipping cost</option><option>Material cost</option><option>Operations</option><option>Photography</option><option>Packaging</option><option>Other</option></select></label>
            <label>Amount (LKR)<input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))} required /></label>
            <label>Date<input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((prev) => ({ ...prev, date: e.target.value }))} /></label>
            <div className="fin-modal-actions">
              <button type="button" className="fin-button ghost" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="fin-button primary"><TbCheck /> Save Spending</button>
            </div>
          </form>
        </Modal>
      )}

      {modal === 'restock' && (
        <Modal title="Restock Critical Items" subtitle={`${criticalRunway || 2} items need immediate restocking`} onClose={() => setModal(null)}>
          <div className="fin-restock-list">
            {runway.slice(0, 2).map((item) => (
              <div className="fin-restock-card" key={item.name}>
                <div><strong>{item.name}</strong><span>{item.stock} units left - estimated leak {money(item.loss)}</span></div>
                <label>Quantity to order<input type="number" defaultValue={item.stock === 0 ? 80 : 120} min="1" /></label>
                <label>Estimated cost<input value={money((item.stock === 0 ? 80 : 120) * item.price * 0.55)} readOnly /></label>
              </div>
            ))}
          </div>
          <div className="fin-restock-summary">Estimated revenue recovery: <strong>{money(exposure)}</strong> per month.</div>
          <div className="fin-modal-actions">
            <button type="button" className="fin-button ghost" onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className="fin-button primary" onClick={() => { setModal(null); notify('Restock order prepared'); }}><TbSend /> Send Restock Order</button>
          </div>
        </Modal>
      )}

      {modal === 'export' && (
        <Modal title="Download Report" subtitle="Choose what to include" onClose={() => setModal(null)} narrow>
          <div className="fin-export-list">
            {['Sales, spending, and profit', 'Money chart', 'Best profit products', 'Old stock and stock left', 'Spending list', 'Recent money activity'].map((item, index) => (
              <label key={item}><input type="checkbox" defaultChecked={index < 3} /> {item}</label>
            ))}
          </div>
          <div className="fin-modal-actions">
            <button type="button" className="fin-button ghost" onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className="fin-button primary" onClick={() => { setModal(null); notify('PDF report export queued'); }}><TbDownload /> Download PDF</button>
          </div>
        </Modal>
      )}

      {modal === 'ai' && aiWork && (
        <Modal title={aiWork.title} subtitle={aiWork.subtitle} onClose={() => setModal(null)}>
          <div className="fin-ai-output">
            {aiWork.items.map((item) => (
              <div className="fin-ai-output-card" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <button type="button" onClick={() => copyText(item.body, `${item.label} copied`)}>
                    Copy
                  </button>
                </div>
                <pre>{item.body}</pre>
              </div>
            ))}
          </div>
          <div className="fin-modal-actions">
            <button type="button" className="fin-button ghost" onClick={() => setModal(null)}>Close</button>
            <button
              type="button"
              className="fin-button primary"
              onClick={() => copyText(aiWork.items.map((item) => `${item.label}\n${item.body}`).join('\n\n'), 'All AI work copied')}
            >
              <TbCheck /> Copy All
            </button>
          </div>
        </Modal>
      )}

      <div className={`fin-toast ${toast ? 'show' : ''}`}>
        <TbCheck /> {toast || 'Done'}
      </div>
    </div>
  );
}
