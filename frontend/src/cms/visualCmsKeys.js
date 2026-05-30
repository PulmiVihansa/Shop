export const editablePageOptions = [
  ['/', 'Homepage'],
  ['/men', 'Men'],
  ['/women', 'Women'],
  ['/new-arrivals', 'New Arrivals'],
  ['/tops', 'Tops'],
  ['/men-new-arrivals', 'Men New Arrivals'],
  ['/men-shirts', 'Men Shirts'],
  ['/men-trousers', 'Men Trousers'],
  ['/accessories', 'Accessories'],
  ['/search', 'Search'],
  ['/checkout', 'Checkout'],
  ['/order-success', 'Order Success'],
  ['/orders/track', 'Order Tracking'],
  ['/sales', 'Sales'],
  ['/giftvoucher', 'Gift Voucher'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
  ['/sizeguide', 'Size Guide'],
  ['/returns', 'Returns'],
  ['/wishlist', 'Wishlist'],
];

export const isVisualCmsExcluded = (pathname) =>
  pathname === '/login' || pathname === '/signup' || pathname.startsWith('/admin');

export const visualPageName = (pathname) => {
  const normalized = pathname === '/' ? 'home' : pathname.replace(/^\/+/, '').replace(/[^\w-]+/g, '_');
  return `visual_${normalized || 'home'}`;
};
