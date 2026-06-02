import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from 'react-icons/fa';
import './footer.css';

const footerColumns = [
  {
    title: 'Shop',
    links: [
      ['Collection', '/collection'],
      ['Gift Vouchers', '/giftvoucher'],
      ['Sale', '/sales'],
      ['Contact Us', '/contact'],
    ],
  },
  {
    title: 'Help',
    links: [
      ['Track Order', '/orders/track'],
      ['Returns', '/returns'],
      ['FAQ', '/faq'],
      ['Support', '/support'],
    ],
  },
];

const socialLinks = [
  ['Instagram', 'https://instagram.com', FaInstagram],
  ['Facebook', 'https://facebook.com', FaFacebookF],
  ['TikTok', 'https://tiktok.com', FaTiktok],
  ['WhatsApp', 'https://wa.me', FaWhatsapp],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-top">
        <div>
          <Link to="/" className="site-footer-logo" aria-label="Astravia home">
            <img src="/models/logo.png" alt="Astravia" />
          </Link>
          <p className="site-footer-about">
            Premium men's graphic tees made in Sri Lanka. Raw aesthetics. Unfiltered style.
            Built for those who wear their attitude.
          </p>
          <div className="site-social-links">
            {socialLinks.map(([label, href, Icon]) => (
              <a href={href} className="site-social-link" key={label} target="_blank" rel="noreferrer" aria-label={label}>
                <Icon aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <div className="site-footer-col-title">{column.title}</div>
            <ul className="site-footer-links">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <Link to={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 ASTRAVIA. Made in Sri Lanka</span>
        <span>Visa · Mastercard · Cash on Delivery · Bank Transfer</span>
      </div>
    </footer>
  );
}
