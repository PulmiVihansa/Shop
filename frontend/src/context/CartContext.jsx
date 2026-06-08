import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const guestCartStorageKey = 'atelier_cart_guest';

const cartKey = (item) => `${item.productId || item.id || item.product || ''}::${item.size || 'One Size'}`;

const normalizeCartItem = (item) => ({
  productId: item.productId || item.id || item.product,
  name: item.name,
  price: Number(item.price || 0),
  originalPrice: Number(item.originalPrice || item.price || 0),
  salePrice: Number(item.salePrice || item.price || 0),
  saleDiscount: Math.max(0, Number(item.saleDiscount || 0)),
  isSale: Boolean(item.isSale),
  saleCampaignId: item.saleCampaignId || '',
  color: item.color || '',
  category: item.category || '',
  image: item.image || item.images?.[0] || '',
  size: item.size || 'One Size',
  quantity: Math.max(1, Number(item.quantity || 1)),
});

const readCartItems = (storageKey) => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter((item) => item.productId) : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user, token } = useAuth();
  const storageKey = useMemo(() => {
    const userKey = user?.customerId || user?.id || user?.email;
    return userKey && token ? `atelier_cart_${userKey}` : guestCartStorageKey;
  }, [token, user?.customerId, user?.email, user?.id]);
  const [items, setItems] = useState(() => readCartItems(storageKey));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setItems(readCartItems(storageKey));
    setIsOpen(false);
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const addItem = useCallback((item) => {
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
  }, []);

  const addItems = useCallback((newItems) => {
    setItems((prev) => {
      const nextItems = Array.isArray(newItems) ? newItems.map(normalizeCartItem).filter((item) => item.productId && item.name) : [];
      return nextItems.reduce((cart, nextItem) => {
        const existing = cart.find((entry) => cartKey(entry) === cartKey(nextItem));
        if (!existing) return [...cart, nextItem];
        return cart.map((entry) =>
          cartKey(entry) === cartKey(nextItem)
            ? { ...entry, quantity: entry.quantity + nextItem.quantity }
            : entry
        );
      }, prev);
    });
  }, []);

  const removeItem = useCallback((productId, size = 'One Size') => {
    const key = `${productId}::${size || 'One Size'}`;
    setItems((prev) => prev.filter((item) => cartKey(item) !== key));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const updateQuantity = useCallback((productId, size, quantity) => {
    const nextQuantity = Number(quantity);
    if (nextQuantity <= 0) {
      const key = `${productId}::${size || 'One Size'}`;
      setItems((prev) => prev.filter((item) => cartKey(item) !== key));
      return;
    }
    const key = `${productId}::${size || 'One Size'}`;
    setItems((prev) => prev.map((item) => (cartKey(item) === key ? { ...item, quantity: nextQuantity } : item)));
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const summary = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { count, subtotal };
  }, [items]);

  const value = useMemo(() => ({
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
  }), [addItem, addItems, clearCart, closeCart, isOpen, items, openCart, removeItem, summary, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
