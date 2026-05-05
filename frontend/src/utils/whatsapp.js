export const buildWhatsAppOrderLink = (phoneNumber, product, size = 'M') => {
  const phone = String(phoneNumber || '94770000000').replace(/[^\d]/g, '');
  const name = product?.name || product?.title || 'this item';
  const price = Number(product?.price || 0).toLocaleString();
  const text = `Hi, I want to order ${name}, Size ${size}, Price Rs. ${price}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};
