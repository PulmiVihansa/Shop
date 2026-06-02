import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FaCheck, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import './ToastProvider.css';

const ToastContext = createContext(null);
const TOAST_DURATION = 3000;
const TOAST_EXIT_DURATION = 260;
const MAX_TOASTS = 3;

const icons = {
  success: <FaCheck />,
  error: <FaTimes />,
  warning: <FaExclamationTriangle />,
};

function ToastItem({ toast }) {
  return (
    <div className={`global-toast ${toast.type} ${toast.leaving ? 'leaving' : ''}`} role="status" aria-live="polite">
      <span className="global-toast-icon">{icons[toast.type] || icons.success}</span>
      <div>
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((current) => current.map((toast) => (
      toast.id === id ? { ...toast, leaving: true } : toast
    )));

    const exitTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(id);
    }, TOAST_EXIT_DURATION);

    const existing = timers.current.get(id) || {};
    timers.current.set(id, { ...existing, exitTimer });
  }, []);

  const show = useCallback((message, type = 'success', title) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const normalizedType = ['success', 'error', 'warning'].includes(type) ? type : 'success';
    const toast = {
      id,
      type: normalizedType,
      title: title || (normalizedType === 'success' ? 'Success' : normalizedType === 'warning' ? 'Attention' : 'Error'),
      message: String(message || ''),
      leaving: false,
    };

    setToasts((current) => [toast, ...current].slice(0, MAX_TOASTS));

    const timer = window.setTimeout(() => removeToast(id), TOAST_DURATION);
    timers.current.set(id, { timer });
  }, [removeToast]);

  useEffect(() => () => {
    timers.current.forEach(({ timer, exitTimer }) => {
      if (timer) window.clearTimeout(timer);
      if (exitTimer) window.clearTimeout(exitTimer);
    });
    timers.current.clear();
  }, []);

  const value = useMemo(() => ({
    show,
    success: (message, title) => show(message, 'success', title),
    error: (message, title) => show(message, 'error', title),
    warning: (message, title) => show(message, 'warning', title),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="global-toast-stack" aria-live="polite" aria-relevant="additions removals">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} />)}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
};
