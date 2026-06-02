const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const getFinanceDashboard = () => ({
  summary: [
    { label: 'Total Revenue', value: 18475000, growth: 18.4, trend: 'up' },
    { label: 'Net Profit', value: 6725000, growth: 11.2, trend: 'up' },
    { label: 'Expenses', value: 4380000, growth: -4.8, trend: 'down' },
    { label: 'Profit Margin', value: 36.4, suffix: '%', growth: 6.1, trend: 'up' }
  ],
  cashFlow: [
    { label: 'Cash Inflow', value: 18475000, trend: 'up', growth: 18.4 },
    { label: 'Cash Outflow', value: 4380000, trend: 'down', growth: -4.8 },
    { label: 'Net Cash Flow', value: 14095000, trend: 'up', growth: 13.6 }
  ],
  monthlyTarget: {
    revenueGoal: 20000000,
    currentRevenue: 18475000,
    completion: 92,
    remaining: 1525000
  },
  financialInsights: [
    { label: 'Best Month', value: 'May 2026' },
    { label: 'Top Category', value: 'Women' },
    { label: 'Top Product', value: 'Silk Wrap Maxi' },
    { label: 'Growth', value: '+18.4%' }
  ],
  revenueSources: [
    { label: 'Website Orders', value: 82 },
    { label: 'Bulk Orders', value: 11 },
    { label: 'Gift Vouchers', value: 7 }
  ],
  monthlyRevenue: months.map((label, index) => ({ label, revenue: [2100000, 2600000, 2950000, 3400000, 3650000, 4175000][index] })),
  monthlyProfit: months.map((label, index) => ({ label, profit: [720000, 960000, 1040000, 1210000, 1325000, 1470000][index] })),
  revenueByCollection: [
    { label: 'Women', value: 9800000 },
    { label: 'Men', value: 5450000 },
    { label: 'Accessories', value: 3225000 }
  ],
  bestProducts: [
    { product: 'Silk Wrap Maxi', orders: 82, revenue: 3977000, profit: 1511000 },
    { product: 'Linen Oxford Shirt', orders: 74, revenue: 1554000, profit: 642000 },
    { product: 'Raffia Structured Tote', orders: 68, revenue: 1190000, profit: 514000 },
    { product: 'Velvet Column Gown', orders: 31, revenue: 1844500, profit: 703000 }
  ],
  recentTransactions: [
    { transactionId: 'TXN-1001', customer: 'Maya Perera', amount: 485000, paymentStatus: 'PAID', date: '2026-05-28' },
    { transactionId: 'TXN-1002', customer: 'Nehan Fernando', amount: 210000, paymentStatus: 'PENDING', date: '2026-05-27' },
    { transactionId: 'TXN-1003', customer: 'Aisha Silva', amount: 595000, paymentStatus: 'PAID', date: '2026-05-25' },
    { transactionId: 'TXN-1004', customer: 'Kavindu Jay', amount: 320000, paymentStatus: 'REFUNDED', date: '2026-05-22' }
  ]
});

module.exports = { getFinanceDashboard };
