
import featuredEditorial from '../assets/featured-editorial.jpg';
import lookbook from '../assets/lookbook.jpg';

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Archivo:wght@300;400;600&display=swap');

        :root {
          --cream: #faf7f2;
          --charcoal: #1a1a1a;
          --terracotta: #c4735a;
          --sage: #a8b5a0;
          --stone: #d4cdc5;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Archivo', sans-serif;
          background: var(--cream);
          color: var(--charcoal);
          overflow-x: hidden;
        }

        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 2rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(180deg, var(--cream) 0%, transparent 100%);
          animation: slideDown 0.8s ease-out;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 300;
          letter-spacing: 0.3em;
          color: var(--charcoal);
        }

        .nav-links {
          display: flex;
          gap: 3rem;
          list-style: none;
        }

        .nav-links a {
          text-decoration: none;
          color: var(--charcoal);
          font-size: 0.9rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          position: relative;
          transition: color 0.3s ease;
        }

        .nav-links a::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--terracotta);
          transition: width 0.4s ease;
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        .hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          padding: 8rem 4rem 4rem;
          gap: 4rem;
          position: relative;
          background: var(--cream);
          border-radius: 0;
          margin: 0;
        }

        .hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          animation: fadeInLeft 1.2s ease-out 0.3s both;
        }

        @keyframes fadeInLeft {
          from {
            transform: translateX(-50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .hero-label {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--terracotta);
          margin-bottom: 2rem;
          font-weight: 600;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 6rem;
          font-weight: 300;
          line-height: 0.9;
          margin-bottom: 2rem;
          letter-spacing: -0.02em;
          color: #000;
        }

        .hero-description {
          font-size: 1.1rem;
          line-height: 1.8;
          font-weight: 300;
          max-width: 500px;
          margin-bottom: 3rem;
          color: rgba(26, 26, 26, 0.8);
        }

        .cta-button {
          display: inline-block;
          padding: 1.2rem 3rem;
          background: var(--charcoal);
          color: var(--cream);
          text-decoration: none;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          width: fit-content;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: var(--terracotta);
          transition: left 0.5s ease;
        }

        .cta-button:hover::before {
          left: 0;
        }

        .cta-button span {
          position: relative;
          z-index: 1;
        }

        .hero-right {
          position: relative;
          animation: fadeInRight 1.2s ease-out 0.5s both;
        }

        @keyframes fadeInRight {
          from {
            transform: translateX(50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .hero-image-stack {
          position: relative;
          width: 100%;
          height: 600px;
        }

        .hero-image {
          position: absolute;
          background: var(--stone);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: rgba(26, 26, 26, 0.3);
          overflow: hidden;
        }

        .hero-image:nth-child(1) {
          width: 70%;
          height: 500px;
          top: 0;
          left: 0;
          z-index: 3;
          background: linear-gradient(135deg, #b8a89a 0%, #d4cdc5 100%);
          animation: floatImage1 6s ease-in-out infinite;
        }

        .hero-image:nth-child(2) {
          width: 50%;
          height: 350px;
          bottom: 0;
          right: 0;
          z-index: 2;
          background: linear-gradient(45deg, #a8b5a0 0%, #c4d3bd 100%);
          animation: floatImage2 6s ease-in-out infinite;
        }

        .hero-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .hero-image-label {
          position: absolute;
          left: 1.25rem;
          bottom: 1.25rem;
          padding: 0.5rem 0.9rem;
          background: rgba(26, 26, 26, 0.55);
          color: var(--cream);
          font-size: 0.85rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: 'Archivo', sans-serif;
        }

        @keyframes floatImage1 {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(-1deg);
          }
        }

        @keyframes floatImage2 {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(15px) rotate(1deg);
          }
        }

        .featured-section {
          padding: 8rem 4rem;
          background: var(--charcoal);
          color: var(--cream);
          position: relative;
          overflow: hidden;
        }

        .featured-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 50%, rgba(196, 115, 90, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(168, 181, 160, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .section-header {
          text-align: center;
          margin-bottom: 6rem;
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .section-subtitle {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--terracotta);
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 4rem;
          font-weight: 300;
          letter-spacing: -0.01em;
        }

        .collection-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .collection-item {
          position: relative;
          overflow: hidden;
          cursor: pointer;
          animation: fadeInStagger 0.8s ease-out both;
        }

        .collection-item:nth-child(1) {
          animation-delay: 0.1s;
        }
        .collection-item:nth-child(2) {
          animation-delay: 0.2s;
        }
        .collection-item:nth-child(3) {
          animation-delay: 0.3s;
        }

        @keyframes fadeInStagger {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .collection-image {
          width: 100%;
          height: 500px;
          background: var(--stone);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: rgba(26, 26, 26, 0.2);
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .collection-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--terracotta);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .collection-item:hover .collection-image {
          transform: scale(1.05);
        }

        .collection-item:hover .collection-image::after {
          opacity: 0.1;
        }

        .collection-info {
          padding: 1.5rem 0;
        }

        .collection-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 400;
          margin-bottom: 0.5rem;
        }

        .collection-price {
          font-size: 0.9rem;
          letter-spacing: 0.1em;
          color: rgba(250, 247, 242, 0.7);
        }

        .statement-section {
          padding: 12rem 4rem;
          text-align: center;
          position: relative;
        }

        .statement-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3.5rem;
          font-weight: 300;
          line-height: 1.4;
          max-width: 900px;
          margin: 0 auto;
          color: var(--charcoal);
          opacity: 0;
          animation: revealText 1.5s ease-out 0.5s forwards;
        }

        @keyframes revealText {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .statement-accent {
          color: var(--terracotta);
          font-style: italic;
        }

        footer {
          background: var(--charcoal);
          color: var(--cream);
          padding: 6rem 4rem 3rem;
        }

        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 4rem;
          max-width: 1400px;
          margin: 0 auto 4rem;
        }

        .footer-brand {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 300;
          letter-spacing: 0.2em;
          margin-bottom: 1rem;
        }

        .footer-tagline {
          font-size: 0.9rem;
          line-height: 1.6;
          color: rgba(250, 247, 242, 0.6);
          max-width: 300px;
        }

        .footer-title {
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          color: var(--terracotta);
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .footer-links a {
          color: rgba(250, 247, 242, 0.7);
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .footer-links a:hover {
          color: var(--cream);
        }

        .footer-bottom {
          text-align: center;
          padding-top: 3rem;
          border-top: 1px solid rgba(250, 247, 242, 0.1);
          font-size: 0.8rem;
          color: rgba(250, 247, 242, 0.5);
        }

        @media (max-width: 968px) {
          nav {
            padding: 1.5rem 2rem;
          }

          .nav-links {
            gap: 1.5rem;
          }

          .hero {
            grid-template-columns: 1fr;
            padding: 6rem 2rem 4rem;
          }

          .hero-title {
            font-size: 4rem;
          }

          .collection-grid {
            grid-template-columns: 1fr;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 3rem;
          }

          .statement-text {
            font-size: 2.5rem;
          }
        }
      `}</style>

      <nav>
        <div className="logo">ATELIER</div>
        <ul className="nav-links">
          <li>
            <a href="#collections">Collections</a>
          </li>
          <li>
            <a href="#about">About</a>
          </li>
          <li>
            <a href="#journal">Journal</a>
          </li>
          <li>
            <a href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <section className="hero">
        <div className="hero-left">
          <div className="hero-label">Spring / Summer 2026</div>
          <h1 className="hero-title">
            Timeless
            <br />
            Elegance,
            <br />
            Redefined
          </h1>
          <p className="hero-description">
            Discover our curated collection of contemporary pieces that blend minimalist design with artisanal
            craftsmanship. Each garment tells a story of conscious creation and enduring style.
          </p>
          <a href="#" className="cta-button">
            <span>Explore Collection</span>
          </a>
        </div>
        <div className="hero-right">
          <div className="hero-image-stack">
            <div className="hero-image">
              <img src={featuredEditorial} alt="Featured editorial" />
              <div className="hero-image-label">Featured Editorial</div>
            </div>
            <div className="hero-image">
              <img src={lookbook} alt="Boo Thing lookbook" />
              <div className="hero-image-label">Boo Thing</div>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section" id="collections">
        <div className="section-header">
          <div className="section-subtitle">New Arrivals</div>
          <h2 className="section-title">Essential Pieces</h2>
        </div>
        <div className="collection-grid">
          <div className="collection-item">
            <div className="collection-image">Linen Blazer</div>
            <div className="collection-info">
              <h3 className="collection-name">Structured Linen Blazer</h3>
              <p className="collection-price">$385</p>
            </div>
          </div>
          <div className="collection-item">
            <div className="collection-image">Silk Dress</div>
            <div className="collection-info">
              <h3 className="collection-name">Flowing Silk Midi</h3>
              <p className="collection-price">$450</p>
            </div>
          </div>
          <div className="collection-item">
            <div className="collection-image">Cotton Shirt</div>
            <div className="collection-info">
              <h3 className="collection-name">Relaxed Cotton Shirt</h3>
              <p className="collection-price">$195</p>
            </div>
          </div>
        </div>
      </section>

      <section className="statement-section" id="about">
        <p className="statement-text">
          Fashion is not about trends. It&apos;s about{' '}
          <span className="statement-accent">expressing who you are</span> through pieces that resonate with your spirit
          and stand the test of time.
        </p>
      </section>

      <footer id="contact">
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
                <a href="#">Contact Us</a>
              </li>
              <li>
                <a href="#">Shipping</a>
              </li>
              <li>
                <a href="#">Returns</a>
              </li>
              <li>
                <a href="#">Size Guide</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">&copy; 2026 Atelier. All rights reserved.</div>
      </footer>
    </>
  );
}
