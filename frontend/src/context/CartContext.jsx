import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('atelier_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('atelier_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (!existing) {
        return [...prev, { ...item, quantity: item.quantity || 1 }];
      }
      return prev.map((entry) =>
        entry.id === item.id ? { ...entry, quantity: entry.quantity + (item.quantity || 1) } : entry
      );
    });
  };

  const addItems = (newItems) => {
    newItems.forEach((item) => addItem(item));
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const updateQuantity = (id, quantity) => {
    const nextQuantity = Number(quantity);
    if (nextQuantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: nextQuantity } : item)));
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
