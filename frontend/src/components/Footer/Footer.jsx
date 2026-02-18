import './footer.css';

export default function Footer() {
  return (
    <footer className="site-footer" id="contact">
      <div className="footer-content">
        <div>
          <div className="footer-brand">ATELIER</div>
          <p className="footer-tagline">
            Contemporary fashion rooted in timeless design principles and sustainable practices.
          </p>
        </div>
        <div>
          <h4 className="footer-title">Shop</h4>
          <ul className="footer-links">
            <li>
              <a href="#">New Arrivals</a>
            </li>
            <li>
              <a href="#">Women</a>
            </li>
            <li>
              <a href="#">Men</a>
            </li>
            <li>
              <a href="#">Accessories</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="footer-title">Social</h4>
          <ul className="footer-links">
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm10 2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2zm-5 3.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm5.75-2.25a1 1 0 110 2 1 1 0 010-2z" />
                </svg>
                Instagram
              </a>
            </li>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="footer-social">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M13 9h3V6h-3c-2.2 0-4 1.8-4 4v3H7v3h2v5h3v-5h3l1-3h-4v-3c0-.6.4-1 1-1z" />
                </svg>
                Facebook
              </a>
            </li>
            <li>
              <a href="https://wa.me" target="_blank" rel="noreferrer" className="footer-social">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3a8.5 8.5 0 00-7.4 13l-1.1 4 4.1-1.1A8.5 8.5 0 1012 3zm0 2a6.5 6.5 0 010 13c-1.1 0-2.2-.3-3.2-.8l-.2-.1-2.4.7.7-2.3-.1-.2A6.5 6.5 0 0112 5zm3.2 8.9c-.2-.1-1.2-.6-1.4-.7-.2-.1-.4-.1-.6.1-.2.2-.7.7-.8.8-.1.1-.3.1-.5 0-.2-.1-1-.4-1.9-1.3-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4.1-.1 0-.3 0-.4l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.5 2.4 3.7 3.3 2.2.9 2.2.6 2.6.6.4 0 1.2-.5 1.4-1 .2-.5.2-.9.1-1z" />
                </svg>
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="footer-title">Support</h4>
          <ul className="footer-links">
            <li>
              <a href="/about">About Us</a>
            </li>
            <li>
              <a href="/contact">Contact Us</a>
            </li>
            <li>
              <a href="returns">Returns</a>
            </li>
            <li>
              <a href="sizeguide">Size Guide</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">&copy; 2026 Atelier. All rights reserved.</div>
    </footer>
  );
}
