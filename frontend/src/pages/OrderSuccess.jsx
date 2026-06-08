import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiClipboard, FiDownload, FiHome, FiMail, FiPackage, FiShield, FiTruck } from 'react-icons/fi';
import api, { getErrorMessage } from '../services/api.js';
import { isSaleItem, itemMetaText } from '../utils/pricing.js';
import '../styles/order-success.css';

const fallbackOrder = {
  orderId: '',
  transactionId: '',
  totalAmount: 0,
  payment: { method: 'Credit / Debit Card', status: 'Paid' },
  shipping: 'standard',
  items: [],
};

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OrderSuccess() {
  const location = useLocation();
  const { state, search } = location;
  const [remoteOrder, setRemoteOrder] = useState(null);
  const [remoteVoucher, setRemoteVoucher] = useState(null);
  const [voucherAction, setVoucherAction] = useState('');
  const [voucherLookupTick, setVoucherLookupTick] = useState(0);
  const [toast, setToast] = useState('');
  const queryOrderId = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get('order_id') || params.get('orderId') || '';
  }, [search]);
  const order = remoteOrder || state?.order || fallbackOrder;
  const orderNumber = order.orderId || order.orderNumber || '';
  const transactionId = order.transactionId || order.payment?.reference || '';
  const items = order.items?.length ? order.items : [];
  const total = order.totalAmount ?? order.totalPrice ?? items.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
  const giftVoucher = remoteVoucher || order.giftVoucher || order.voucher || null;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  useEffect(() => {
    if (!queryOrderId || state?.order) return;
    let active = true;
    api.get(`/payments/order/${encodeURIComponent(queryOrderId)}`)
      .then((response) => {
        if (active) setRemoteOrder(response.data);
      })
      .catch(() => {
        if (active) setRemoteOrder(null);
      });
    return () => {
      active = false;
    };
  }, [queryOrderId, state?.order]);

  useEffect(() => {
    if (!queryOrderId || giftVoucher || String(order.paymentStatus || order.payment?.status || '').toLowerCase() !== 'paid') return;
    let active = true;
    let retryTimer = null;
    api.get(`/gift-vouchers/order/${encodeURIComponent(queryOrderId)}`)
      .then((response) => {
        if (active) setRemoteVoucher(response.data);
      })
      .catch(() => {
        if (!active) return;
        setRemoteVoucher(null);
        if (voucherLookupTick < 5) {
          retryTimer = window.setTimeout(() => setVoucherLookupTick((value) => value + 1), 1800);
        }
      });
    return () => {
      active = false;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [giftVoucher, order.payment?.status, order.paymentStatus, queryOrderId, voucherLookupTick]);

  const downloadVoucherPdf = async () => {
    if (!giftVoucher?.id || voucherAction) {
      showToast('Please complete voucher payment first.');
      return;
    }
    setVoucherAction('download');
    try {
      const response = await api.get(`/gift-vouchers/${encodeURIComponent(giftVoucher.id)}/download`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Astravia-${giftVoucher.voucherCode}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      showToast('Voucher PDF downloaded.');
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setVoucherAction('');
    }
  };

  const resendVoucherEmail = async () => {
    if (!giftVoucher?.id || voucherAction) {
      showToast('Please complete voucher payment first.');
      return;
    }
    setVoucherAction('email');
    try {
      await api.post(`/gift-vouchers/${encodeURIComponent(giftVoucher.id)}/email`);
      showToast('Voucher email sent.');
    } catch (error) {
      showToast(getErrorMessage(error));
    } finally {
      setVoucherAction('');
    }
  };

  return (
    <section className="astravia-confirmation-page">
      <div className="confirmation-steps" aria-label="Checkout progress">
        {[
          ['01.', 'Cart'],
          ['02.', 'Checkout'],
          ['03.', 'Payment'],
          ['04.', 'Confirmation'],
        ].map(([number, label], index) => (
          <div className={label === 'Confirmation' ? 'active' : ''} key={label}>
            <span>{number}</span>
            {label}
            {index < 3 && <i aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="confirmation-shell">
        <main className="confirmation-hero confirmation-animate">
          <div className="confirmation-mark" aria-hidden="true">
            <FiCheck />
          </div>
          <span className="confirmation-kicker">Order Confirmed</span>
          <h1>Drop Secured.</h1>
          <p>
            Your Astravia order is locked in. We are preparing your pieces and will send delivery updates as the order moves.
          </p>

          <div className="confirmation-meta">
            <div>
              <span>Order ID</span>
              <strong>{orderNumber || 'Pending'}</strong>
            </div>
            <div>
              <span>Transaction ID</span>
              <strong>{transactionId || 'Pending'}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{order.payment?.status || order.paymentStatus || 'Pending'}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatPrice(total)}</strong>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/orders/track" className="confirmation-primary">
              Track Order
              <FiArrowRight aria-hidden="true" />
            </Link>
            <Link to="/collection" className="confirmation-secondary">
              Continue Shopping
            </Link>
            <Link to="/" className="confirmation-ghost">
              <FiHome aria-hidden="true" />
              Back Home
            </Link>
          </div>

          {giftVoucher && (
            <div className="confirmation-voucher-card">
              <span>Gift Voucher Active</span>
              <h2>{giftVoucher.voucherCode}</h2>
              <p>{giftVoucher.recipientName} - {formatPrice(giftVoucher.amount)}</p>
              <div>
                <button type="button" onClick={downloadVoucherPdf}>
                  <FiDownload aria-hidden="true" />
                  {voucherAction === 'download' ? 'Preparing...' : 'Download PDF'}
                </button>
                <button type="button" onClick={resendVoucherEmail}>
                  <FiMail aria-hidden="true" />
                  {voucherAction === 'email' ? 'Sending...' : 'Resend Email'}
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="confirmation-receipt confirmation-animate">
          <div className="receipt-head">
            <span>Digital Receipt</span>
            <h2>Order Summary</h2>
          </div>

          <div className="receipt-items">
            {items.map((item) => (
              <div className="receipt-item" key={`${item.productId || item.name}-${item.size || 'One Size'}`}>
                <img src={item.image} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>{itemMetaText(item)} {itemMetaText(item) ? '/ ' : ''}Qty {item.quantity || 1}</span>
                </div>
                <p className="astravia-price-stack">
                  <span className={isSaleItem(item) ? 'sale-price' : 'normal-price'}>{formatPrice(Number(item.price || 0) * (item.quantity || 1))}</span>
                  {isSaleItem(item) && <span className="original-price">{formatPrice(Number(item.originalPrice || 0) * (item.quantity || 1))}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="receipt-total">
            <span>Total Paid</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <div className="confirmation-delivery-card">
            <FiTruck aria-hidden="true" />
            <div>
              <h3>Delivery Window</h3>
              <p>{order.shipping === 'express' ? '1-2 business days' : '3-5 business days'} after order processing.</p>
            </div>
          </div>
        </aside>

        <section className="confirmation-timeline confirmation-animate">
          {[
            [FiShield, 'Payment Verified', 'Your payment status has been confirmed and secured.'],
            [FiClipboard, 'Order Review', 'Astravia checks stock, sizing, and delivery details.'],
            [FiPackage, 'Packing Drop', 'Your pieces are packed in the Astravia dispatch flow.'],
            [FiTruck, 'Delivery Update', 'You will receive tracking or delivery contact soon.'],
          ].map(([Icon, title, text], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <Icon aria-hidden="true" />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </section>
      </div>
      {toast && <div className="confirmation-toast">{toast}</div>}
    </section>
  );
}
