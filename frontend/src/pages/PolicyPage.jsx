import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiClock, FiLock, FiMapPin, FiPackage, FiShield, FiTruck } from 'react-icons/fi';
import '../styles/policy.css';

const icons = {
  privacy: FiShield,
  terms: FiLock,
  shipping: FiTruck,
};

const policies = {
  '/privacy': {
    type: 'privacy',
    kicker: 'Privacy Policy',
    title: 'Your data stays clean, guarded, and used with intent.',
    intro: 'We collect only the details needed to run your account, process orders, deliver support, and keep Astravia secure.',
    stamped: 'Last updated June 2026',
    stat: ['Encrypted checkout', 'Order data only', 'Support first'],
    sections: [
      ['Information we collect', 'Account details, delivery information, order history, payment status, support messages, wishlist activity, and basic site analytics.'],
      ['How we use it', 'To process orders, confirm delivery, answer support requests, protect accounts, prevent fraud, and improve the shopping experience.'],
      ['Payment safety', 'Online payment details are handled by the selected payment provider. Astravia does not need to store raw card numbers.'],
      ['Your control', 'You can request help with account updates, order records, or privacy questions through our support channels.'],
    ],
    timeline: [
      ['01', 'Checkout details are captured only when you place an order.'],
      ['02', 'Delivery and payment status are shared with the teams or providers needed to complete the order.'],
      ['03', 'Support records help us solve follow-up questions without making you repeat everything.'],
    ],
    links: [
      ['Contact Support', '/contact'],
      ['Track Order', '/order-tracking'],
    ],
  },
  '/terms': {
    type: 'terms',
    kicker: 'Terms & Conditions',
    title: 'The rules of the drop, written in plain language.',
    intro: 'By using Astravia, creating an account, or placing an order, you agree to shop fairly and follow the store policies shown here.',
    stamped: 'Effective for all current orders',
    stat: ['Fair checkout', 'Verified stock', 'Secure payments'],
    sections: [
      ['Orders', 'Orders are confirmed after payment or approved cash-on-delivery checkout, subject to stock availability and fraud checks.'],
      ['Product information', 'We aim to keep prices, stock, images, and descriptions accurate. Minor color, display, or fit differences can happen.'],
      ['Returns and exchanges', 'Returns and exchanges follow the published returns policy and must meet the condition and time-window requirements.'],
      ['Account conduct', 'Do not misuse the site, attempt fraudulent orders, interfere with services, or submit false customer information.'],
    ],
    timeline: [
      ['01', 'Browse products, sizes, prices, and availability before checkout.'],
      ['02', 'Place the order with accurate contact, payment, and delivery details.'],
      ['03', 'Use support, returns, or tracking pages if something needs attention after purchase.'],
    ],
    links: [
      ['Returns Policy', '/returns'],
      ['Contact Support', '/contact'],
    ],
  },
  '/shipping': {
    type: 'shipping',
    kicker: 'Shipping Policy',
    title: 'Packed with care. Sent with a trackable paper trail.',
    intro: 'Shipping options, delivery fees, and timelines are shown during checkout based on your order and available delivery method.',
    stamped: 'Island-wide delivery support',
    stat: ['3-5 day standard', '1-2 day express', 'Trackable orders'],
    sections: [
      ['Dispatch', 'Orders are packed and dispatched within the timeframe shown at checkout or in your order confirmation.'],
      ['Delivery fees', 'Delivery fees are calculated at checkout based on the order and available shipping methods.'],
      ['Tracking', 'Customers can track eligible orders from their account or the order tracking page.'],
      ['Delivery issues', 'Incorrect addresses, courier delays, or failed delivery attempts may require support follow-up before redelivery.'],
    ],
    timeline: [
      ['01', 'Order received and payment or COD eligibility confirmed.'],
      ['02', 'Items are packed, checked, and handed over for dispatch.'],
      ['03', 'Tracking updates appear once the courier has scanned the package.'],
    ],
    links: [
      ['Track Order', '/order-tracking'],
      ['Shipping Help', '/support'],
    ],
  },
};

export default function PolicyPage() {
  const location = useLocation();
  const policy = policies[location.pathname] || policies['/terms'];
  const Icon = icons[policy.type] || FiShield;

  return (
    <main className={`policy-page policy-page--${policy.type}`}>
      <div className="policy-shell">
        <section className="policy-hero" aria-labelledby="policy-title">
          <div className="policy-hero-copy">
            <p className="policy-kicker">{policy.kicker}</p>
            <h1 id="policy-title">{policy.title}</h1>
            <p className="policy-intro">{policy.intro}</p>
            <div className="policy-actions">
              {policy.links.map(([label, to]) => (
                <Link className="policy-action" to={to} key={to}>
                  <span>{label}</span>
                  <FiArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          <aside className="policy-hero-card" aria-label={`${policy.kicker} summary`}>
            <span className="policy-icon">
              <Icon aria-hidden="true" />
            </span>
            <p>{policy.stamped}</p>
            <div className="policy-stat-list">
              {policy.stat.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </aside>
        </section>

        <section className="policy-grid" aria-label={`${policy.kicker} details`}>
          {policy.sections.map(([title, body], index) => (
            <article className="policy-card" key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>

        <section className="policy-lower">
          <div className="policy-timeline">
            <p className="policy-section-label">Process</p>
            {policy.timeline.map(([number, body]) => (
              <article key={number}>
                <span>{number}</span>
                <p>{body}</p>
              </article>
            ))}
          </div>

          <div className="policy-support-panel">
            <p className="policy-section-label">Need help?</p>
            <h2>Keep your order details ready and we will help you sort it.</h2>
            <div className="policy-support-grid">
              <span><FiPackage aria-hidden="true" /> Order ID</span>
              <span><FiMapPin aria-hidden="true" /> Delivery address</span>
              <span><FiClock aria-hidden="true" /> Timeline</span>
            </div>
            <Link to="/contact" className="policy-support-link">Contact support</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
