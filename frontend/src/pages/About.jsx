import { useEffect } from 'react';
import '../styles/about.css';

const marqueeItems = [
  'Designed in Sri Lanka',
  'Premium streetwear',
  'Limited drops',
  'Heavyweight cotton',
  'Oversized fits',
  'Built for everyday movement',
];

const timelineItems = [
  {
    year: '2024',
    title: 'Astravia Begins',
    body: 'Astravia starts with a simple idea: graphic streetwear that feels premium, local, and unapologetically direct.',
  },
  {
    year: '2025',
    title: 'First Core Tees',
    body: 'The first oversized tee blocks are refined for weight, drape, print placement, and Sri Lankan weather.',
  },
  {
    year: '2026',
    title: 'Online Store Launch',
    body: 'Astravia launches online with product drops, gift vouchers, sale rooms, account tools, and digital order support.',
  },
  {
    year: 'Next',
    title: 'More Drops, Cleaner Systems',
    body: 'The next chapter is sharper stock control, better visuals, faster fulfilment, and a tighter drop calendar.',
  },
];

const values = [
  {
    num: '01 - Fit',
    name: 'Oversized.\nIntentional.',
    body: "Every Astravia piece starts with the silhouette: relaxed shoulders, clean length, enough weight to hold shape, and enough movement for daily wear.",
    svg: (
      <svg className="vic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '02 - Graphics',
    name: 'Raw ideas.\nClean execution.',
    body: 'The artwork is made to say something fast. Strong contrast, street-level energy, and prints that feel part of the garment instead of decoration pasted on top.',
    svg: (
      <svg className="vic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    num: '03 - Trust',
    name: 'Real stock.\nReal support.',
    body: 'Clear sizing, visible availability, practical returns, and order support matter as much as the drop itself. A real brand earns repeat customers after checkout.',
    svg: (
      <svg className="vic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const teamMembers = [
  {
    name: 'Creative Direction',
    role: 'Brand, drops, and product language',
    tag: 'Direction',
    bio: 'Sets the visual tone for Astravia: bold graphics, tight edits, and a product line that feels direct from first scroll to final package.',
    className: 'bm1',
  },
  {
    name: 'Product Operations',
    role: 'Stock, fulfilment, and quality checks',
    tag: 'Ops',
    bio: 'Keeps product data, sizes, stock, and dispatch details accurate so the online store reflects what customers can actually buy.',
    className: 'bm2',
  },
  {
    name: 'Customer Care',
    role: 'Sizing, returns, and order support',
    tag: 'Support',
    bio: 'Answers the questions that decide whether someone checks out: fit, delivery, payments, exchanges, and where their order is.',
    className: 'bm3',
  },
  {
    name: 'Content & Community',
    role: 'Campaigns, social, and launch moments',
    tag: 'Community',
    bio: 'Turns drops into moments with product photography, launch copy, short-form content, and customer feedback loops.',
    className: 'bm4',
  },
];

export default function About() {
  useEffect(() => {
    document.title = 'Astravia | Our Story';
    const items = document.querySelectorAll('.about-page .ti');
    if (!items.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('vis'), index * 120);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      <section className="hero">
        <div className="hero-l">
          <div className="yr-bg" aria-hidden="true">
            2026
          </div>
          <div className="hero-txt">
            <div className="eyebrow">Sri Lankan streetwear</div>
            <h1 className="hero-h1">
              Our
              <br />
              <em>Story</em>
            </h1>
            <div className="hero-stats">
              <div>
                <span className="sv">LKR</span>
                <span className="sl">Local pricing</span>
              </div>
              <div>
                <span className="sv">24/7</span>
                <span className="sl">Online store</span>
              </div>
              <div>
                <span className="sv">2026</span>
                <span className="sl">Drop season</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-r">
          <blockquote className="hero-quote">
            "Astravia is for people who want their clothes to feel sharp before they say a word."
          </blockquote>
          <p className="hero-attr">Astravia Studio</p>
        </div>
      </section>

      <div className="mbar" aria-hidden="true">
        <div className="mi">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span className="mitm" key={`${item}-${index}`}>
              {item} <span className="mdot" />
            </span>
          ))}
        </div>
      </div>

      <section className="origin">
        <div>
          <div className="sec-ey">Where it began</div>
          <h2 className="orig-h">
            Local energy.
            <br />A <em>cleaner</em> drop.
          </h2>
          <div className="orig-body">
            <p>
              Astravia is a premium streetwear project built around men&apos;s oversized graphic tees, limited drops,
              and a buying experience that feels direct from product page to delivery.
            </p>
            <blockquote className="pull">
              "Break rules, not style."
            </blockquote>
            <p>
              The brand language is raw, graphic, and minimal where it needs to be. Product pages should show the fit,
              stock, care details, price, and checkout path clearly, because trust is part of the design.
            </p>
            <p>
              This store is the foundation: collection pages, sale drops, gift vouchers, account tools, order tracking,
              invoices, and admin workflows that can grow with the brand.
            </p>
          </div>
        </div>
        <div className="img-stack">
          <div className="img-main">
            <span className="img-lbl">Astravia launch direction</span>
          </div>
          <div className="img-fl">
            <span className="img-fl-l">First online drop</span>
          </div>
          <p className="img-cap">
            The first launch focuses on clean product data, strong visuals, dependable stock, and a checkout flow people can trust.
          </p>
        </div>
      </section>

      <section className="tl-section">
        <div className="tl-head">
          <div className="sec-ey" style={{ marginBottom: 0 }}>
            A decade of making
          </div>
          <h2 className="tl-h">The journey so far</h2>
        </div>
        <div className="tl-track">
          {timelineItems.map((item) => (
            <div className="ti" key={item.year}>
              <div className="tdot" />
              <div className="tyr">{item.year}</div>
              <div className="ttitle">{item.title}</div>
              <p className="tbody">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="vals">
        <div className="vals-hd">
          <div className="vals-ey">What we believe</div>
          <h2 className="vals-h">Three things we will never compromise on</h2>
        </div>
        <div className="vgrid">
          {values.map((value) => (
            <div className="vc" key={value.num}>
              <span className="vnum">{value.num}</span>
              {value.svg}
              <h3 className="vname">
                {value.name.split('\n').map((line) => (
                  <span key={line}>
                    {line}
                    <br />
                  </span>
                ))}
              </h3>
              <p className="vbody">{value.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mfst">
        <div className="mfst-lbl">Our manifesto</div>
        <p className="mfst-txt">
            "A real streetwear store is not just the look. It is stock that is accurate, support that replies, and a checkout that works every time."
        </p>
        <p className="mfst-sig">Astravia</p>
        <p className="mfst-role">Premium streetwear, Sri Lanka</p>
      </section>

      <section className="team">
        <div className="team-hd">
          <h2 className="team-h">
            The people
            <br />
            behind the pieces
          </h2>
          <p className="team-d">
            A compact launch team can still feel premium when the product data, visuals, service, and fulfilment are
            handled with care. Hover to learn more.
          </p>
        </div>
        <div className="tgrid">
          {teamMembers.map((member) => (
            <div className="member" key={member.name}>
              <div className="mimg">
                <div className={`mib ${member.className}`} />
                <div className="mov" />
                <span className="mrt">{member.tag}</span>
              </div>
              <div className="mname">{member.name}</div>
              <div className="mrole">{member.role}</div>
              <p className="mbio">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
