import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const cartKey = (item) => `${item.productId || item.id || item.product || ''}::${item.size || 'One Size'}`;

const normalizeCartItem = (item) => ({
  productId: item.productId || item.id || item.product,
  name: item.name,
  price: Number(item.price || 0),
  image: item.image || item.images?.[0] || '',
  size: item.size || 'One Size',
  quantity: Math.max(1, Number(item.quantity || 1)),
});

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('atelier_cart');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter((item) => item.productId) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('atelier_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    const nextItem = normalizeCartItem(item);
    if (!nextItem.productId || !nextItem.name) return;

    setItems((prev) => {
      const existing = prev.find((entry) => cartKey(entry) === cartKey(nextItem));
      if (!existing) {
        return [...prev, nextItem];
      }
      return prev.map((entry) =>
        cartKey(entry) === cartKey(nextItem)
          ? { ...entry, quantity: entry.quantity + nextItem.quantity }
          : entry
      );
    });
  };

  const addItems = (newItems) => {
    newItems.forEach((item) => addItem(item));
  };

  const removeItem = (productId, size = 'One Size') => {
    const key = `${productId}::${size || 'One Size'}`;
    setItems((prev) => prev.filter((item) => cartKey(item) !== key));
  };

  const clearCart = () => setItems([]);

  const updateQuantity = (productId, size, quantity) => {
    const nextQuantity = Number(quantity);
    if (nextQuantity <= 0) {
      removeItem(productId, size);
      return;
    }
    const key = `${productId}::${size || 'One Size'}`;
    setItems((prev) => prev.map((item) => (cartKey(item) === key ? { ...item, quantity: nextQuantity } : item)));
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const summary = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { count, subtotal };
  }, [items]);

  const value = {
    items,
    isOpen,
    summary,
    addItem,
    addItems,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
