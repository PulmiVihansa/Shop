
import Header from '../components/Header.jsx';
import Footer from '../components/Footer/Footer.jsx';
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

        /* Statement section */
        .statement-section {
          padding: 0;
          background: var(--cream);
          position: relative;
          overflow: hidden;
        }

        .statement-section::before {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--stone) 20%, var(--stone) 80%, transparent);
        }

        .marquee-strip {
          background: var(--terracotta);
          padding: 1rem 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .marquee-inner {
          display: inline-flex;
          animation: marquee 22s linear infinite;
          gap: 0;
        }

        .marquee-inner span {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem;
          font-weight: 300;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--cream);
          padding: 0 3rem;
        }

        .marquee-inner .dot {
          color: rgba(250, 247, 242, 0.4);
          padding: 0;
          letter-spacing: 0;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .pillars-section {
          padding: 7rem 4rem;
          background: var(--cream);
          border-top: 1px solid var(--stone);
        }

        .pillars-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--stone);
        }

        .pillars-label {
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--terracotta);
          font-weight: 600;
        }

        .pillars-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 300;
          color: var(--charcoal);
          letter-spacing: -0.01em;
        }

        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
        }

        .pillar-card {
          padding: 3rem 3.5rem;
          border-right: 1px solid var(--stone);
          position: relative;
          overflow: hidden;
          transition: background 0.4s ease;
        }

        .pillar-card:last-child {
          border-right: none;
        }

        .pillar-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 0;
          background: var(--terracotta);
          transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pillar-card:hover::after {
          height: 100%;
        }

        .pillar-card:hover {
          background: rgba(212, 205, 197, 0.14);
        }

        .pillar-index {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.72rem;
          letter-spacing: 0.18em;
          color: rgba(26, 26, 26, 0.35);
          display: block;
          margin-bottom: 2rem;
        }

        .pillar-icon-line {
          width: 32px;
          height: 1px;
          background: var(--terracotta);
          margin-bottom: 1.8rem;
        }

        .pillar-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.9rem;
          font-weight: 400;
          color: var(--charcoal);
          line-height: 1.15;
          margin-bottom: 1.2rem;
          letter-spacing: -0.01em;
        }

        .pillar-body {
          font-size: 0.88rem;
          line-height: 1.75;
          font-weight: 300;
          color: rgba(26, 26, 26, 0.6);
        }

        .pillar-read-more {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2rem;
          font-size: 0.72rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--terracotta);
          text-decoration: none;
          font-weight: 600;
          transition: gap 0.3s ease;
        }

        .pillar-read-more:hover {
          gap: 0.9rem;
        }

        .pillar-read-more svg {
          width: 14px;
          height: 14px;
          stroke: currentColor;
          fill: none;
          stroke-width: 1.5;
        }

        .process-strip {
          background: linear-gradient(120deg, #ffffff 0%, var(--stone) 100%);
          padding: 5rem 4rem;
          display: flex;
          align-items: center;
          gap: 0;
          overflow: hidden;
          position: relative;
        }

        .process-strip::before {
          content: 'PROCESS';
          position: absolute;
          top: 50%;
          left: 4rem;
          transform: translateY(-50%);
          font-family: 'Cormorant Garamond', serif;
          font-size: 10rem;
          font-weight: 300;
          color: rgba(26, 26, 26, 0.05);
          letter-spacing: 0.1em;
          pointer-events: none;
          white-space: nowrap;
        }

        .process-steps {
          display: flex;
          align-items: center;
          gap: 0;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        .process-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          padding: 0 2.5rem;
          border-right: 1px solid rgba(26, 26, 26, 0.1);
          position: relative;
        }

        .process-step:last-child {
          border-right: none;
        }

        .process-index {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.75rem;
          color: var(--terracotta);
          letter-spacing: 0.15em;
        }

        .process-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.55rem;
          font-weight: 300;
          color: var(--charcoal);
          line-height: 1.2;
        }

        .process-note {
          font-size: 0.78rem;
          font-weight: 300;
          color: rgba(26, 26, 26, 0.55);
          line-height: 1.55;
        }

        .process-arrow {
          width: 28px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(196, 115, 90, 0.5);
          font-size: 1rem;
        }

        .statement-section::after {
          content: '';
          display: block;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--stone) 20%, var(--stone) 80%, transparent);
        }

        @media (max-width: 968px) {
          .pillars-header {
            flex-direction: column;
            gap: 0.8rem;
          }

          .pillars-grid {
            grid-template-columns: 1fr;
          }

          .pillar-card {
            border-right: none;
            border-bottom: 1px solid var(--stone);
          }

          .pillar-card:last-child {
            border-bottom: none;
          }

          .process-steps {
            flex-direction: column;
            align-items: flex-start;
            gap: 2rem;
          }

          .process-step {
            border-right: none;
            border-bottom: 1px solid rgba(26, 26, 26, 0.1);
            padding: 0 0 2rem;
          }

          .process-arrow {
            display: none;
          }

          .process-strip::before {
            display: none;
          }
        }


        @media (max-width: 968px) {
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


        }
      `}</style>
      <Header />

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
              <p className="collection-price">LKR385</p>
            </div>
          </div>
          <div className="collection-item">
            <div className="collection-image">Silk Dress</div>
            <div className="collection-info">
              <h3 className="collection-name">Flowing Silk Midi</h3>
              <p className="collection-price">LKR450</p>
            </div>
          </div>
          <div className="collection-item">
            <div className="collection-image">Cotton Shirt</div>
            <div className="collection-info">
              <h3 className="collection-name">Relaxed Cotton Shirt</h3>
              <p className="collection-price">LKR195</p>
            </div>
          </div>
        </div>
      </section>

      <section className="statement-section" id="about">
        <div className="marquee-strip" aria-hidden="true">
          <div className="marquee-inner">
            <span>Handcrafted in small batches</span><span className="dot">&middot;</span>
            <span>Natural fibres only</span><span className="dot">&middot;</span>
            <span>Zero-waste pattern cutting</span><span className="dot">&middot;</span>
            <span>Made to last a lifetime</span><span className="dot">&middot;</span>
            <span>Spring &amp; Summer 2026</span><span className="dot">&middot;</span>
            <span>Atelier Collection</span><span className="dot">&middot;</span>
            <span>Handcrafted in small batches</span><span className="dot">&middot;</span>
            <span>Natural fibres only</span><span className="dot">&middot;</span>
            <span>Zero-waste pattern cutting</span><span className="dot">&middot;</span>
            <span>Made to last a lifetime</span><span className="dot">&middot;</span>
            <span>Spring &amp; Summer 2026</span><span className="dot">&middot;</span>
            <span>Atelier Collection</span><span className="dot">&middot;</span>
          </div>
        </div>

        <div className="pillars-section">
          <div className="pillars-header">
            <span className="pillars-label">Our Principles</span>
            <h2 className="pillars-title">Built on three commitments</h2>
          </div>
          <div className="pillars-grid">
            <div className="pillar-card">
              <span className="pillar-index">01 - Sustainability</span>
              <div className="pillar-icon-line" />
              <h3 className="pillar-name">
                Sustainable
                <br />
                Fashion
              </h3>
              <p className="pillar-body">
                We use eco-friendly materials and ethical production methods throughout every stage of our supply
                chain. From certified organic cotton to post-consumer recycled fibres, every piece is designed to
                minimise its footprint on the planet without compromising on quality.
              </p>
              <a href="#" className="pillar-read-more">
                Learn more
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <div className="pillar-card">
              <span className="pillar-index">02 - Craftsmanship</span>
              <div className="pillar-icon-line" />
              <h3 className="pillar-name">
                Artisan
                <br />
                Craftsmanship
              </h3>
              <p className="pillar-body">
                Each garment is handcrafted by skilled artisans who bring decades of experience to every stitch. We
                celebrate slow fashion - the kind that takes time, care, and an eye for detail that no machine can
                replicate. Quality is not a finish; it is the foundation.
              </p>
              <a href="#" className="pillar-read-more">
                Meet our makers
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <div className="pillar-card">
              <span className="pillar-index">03 - Design</span>
              <div className="pillar-icon-line" />
              <h3 className="pillar-name">
                Timeless
                <br />
                Design
              </h3>
              <p className="pillar-body">
                We create pieces that transcend seasons and resist trends. Our silhouettes are drawn to be worn, loved,
                and cherished for years - then handed on. A wardrobe built on intention rather than impulse is the most
                sustainable wardrobe of all.
              </p>
              <a href="#" className="pillar-read-more">
                View collection
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="process-strip">
          <div className="process-steps">
            <div className="process-step">
              <span className="process-index">01 - Concept</span>
              <span className="process-name">
                Sketch &amp;
                <br />
                Drape
              </span>
              <p className="process-note">Each silhouette begins on a live form, never a screen.</p>
            </div>
            <div className="process-arrow">&rarr;</div>
            <div className="process-step">
              <span className="process-index">02 - Source</span>
              <span className="process-name">
                Fabric
                <br />
                Selection
              </span>
              <p className="process-note">We visit mills in person. No catalogues. No shortcuts.</p>
            </div>
            <div className="process-arrow">&rarr;</div>
            <div className="process-step">
              <span className="process-index">03 - Cut</span>
              <span className="process-name">
                Hand
                <br />
                Tailoring
              </span>
              <p className="process-note">Two tailors per garment. One for the body, one for the finish.</p>
            </div>
            <div className="process-arrow">&rarr;</div>
            <div className="process-step">
              <span className="process-index">04 - Inspect</span>
              <span className="process-name">
                48-Hour
                <br />
                Quality Hold
              </span>
              <p className="process-note">Every piece rests before it ships. Tension reveals truth.</p>
            </div>
            <div className="process-arrow">&rarr;</div>
            <div className="process-step">
              <span className="process-index">05 - Yours</span>
              <span className="process-name">
                Delivered
                <br />
                &amp; Registered
              </span>
              <p className="process-note">Paired with a digital repair passport, valid for life.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}







