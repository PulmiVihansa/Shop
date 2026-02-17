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
          <h4 className="footer-title">About</h4>
          <ul className="footer-links">
            <li>
              <a href="#">Our Story</a>
            </li>
            <li>
              <a href="#">Sustainability</a>
            </li>
            <li>
              <a href="#">Craftsmanship</a>
            </li>
            <li>
              <a href="#">Careers</a>
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
