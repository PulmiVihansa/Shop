const getAnalyticsDashboard = () => ({
  kpis: [
    { label: 'Visitors', value: 48200, growth: 14.8, trend: 'up' },
    { label: 'Conversion Rate', value: 4.7, suffix: '%', growth: 0.8, trend: 'up' },
    { label: 'Average Order Value', value: 236000, growth: 9.5, trend: 'up' },
    { label: 'Returning Customers', value: 1284, growth: 12.1, trend: 'up' }
  ],
  newCustomers: [
    { label: 'Mon', customers: 38 },
    { label: 'Tue', customers: 44 },
    { label: 'Wed', customers: 51 },
    { label: 'Thu', customers: 63 },
    { label: 'Fri', customers: 58 },
    { label: 'Sat', customers: 76 },
    { label: 'Sun', customers: 69 }
  ],
  returningCustomers: [
    { label: 'Mon', customers: 92 },
    { label: 'Tue', customers: 108 },
    { label: 'Wed', customers: 116 },
    { label: 'Thu', customers: 121 },
    { label: 'Fri', customers: 135 },
    { label: 'Sat', customers: 164 },
    { label: 'Sun', customers: 148 }
  ],
  popularCategories: [
    { label: 'Graphic Tees', value: 64 },
    { label: 'Oversized Tees', value: 41 },
    { label: 'Hoodies', value: 29 }
  ],
  topProducts: [
    { name: 'Astravia Noir Graphic Tee', views: 8420, sales: 82, conversion: 6.4 },
    { name: 'Linen Oxford Shirt', views: 7060, sales: 74, conversion: 5.8 },
    { name: 'Gold Mark Hoodie', views: 5940, sales: 68, conversion: 5.1 }
  ],
  heatmap: [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 56 },
    { label: 'Wed', value: 61 },
    { label: 'Thu', value: 74 },
    { label: 'Fri', value: 88 },
    { label: 'Sat', value: 100 },
    { label: 'Sun', value: 81 }
  ],
  insights: {
    bestSellingProduct: 'Astravia Noir Graphic Tee',
    highestRevenueCategory: 'Graphic Tees',
    highestRevenueMonth: 'May 2026',
    mostValuableCustomer: 'Maya Perera'
  }
});

module.exports = { getAnalyticsDashboard };
