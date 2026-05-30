import { useEffect } from 'react';
import '../styles/about.css';
import usePageContent, { lines } from '../hooks/usePageContent.js';

const marqueeItems = [
  'Handcrafted in Paris',
  'Est. 2014',
  'Slow fashion',
  'Natural fibres only',
  'Zero waste cutting',
  'Lifetime repair guarantee',
];

const timelineItems = [
  {
    year: '2014',
    title: 'The Atelier Opens',
    body: 'A 40m2 workshop. One machine. Two chairs. Twelve pieces. Sold out in eleven days, word of mouth only.',
  },
  {
    year: '2016',
    title: 'Lifetime Repair Introduced',
    body: 'The first fashion house in France to offer unconditional, perpetual repair. No charge. No questions asked. Ever.',
  },
  {
    year: '2019',
    title: 'Zero-Waste & B Corp',
    body: 'Zero-waste pattern cutting adopted. First B Corp certification awarded. Carbon footprint reduced by 40% in twelve months.',
  },
  {
    year: '2022',
    title: 'Atelier Goes Digital',
    body: 'Atelier.com launches. First digital collection ships to 34 countries in the opening week - still 12 pieces per silhouette.',
  },
  {
    year: '2026',
    title: 'Spring / Summer 2026',
    body: 'Twelve artisans. One workshop. Same door-on-sawhorses cutting table. The conviction has not changed by a stitch.',
  },
];

const values = [
  {
    num: '01 - Sustainability',
    name: 'Make less.\nMake better.',
    body: "Every fibre sourced within 200km of our atelier. Zero waste cutting. Batches of twelve. Not because it's good marketing - because it's the only honest way to make clothes.",
    svg: (
      <svg className="vic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '02 - Craftsmanship',
    name: 'Slow hands.\nLasting work.',
    body: 'Every seam in every Atelier garment is set twice. Two tailors work each piece - one for the body, one for the finish. This takes longer. It also means your garment will outlast a decade.',
    svg: (
      <svg className="vic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    num: '03 - Longevity',
    name: 'Designed to\nlast forever.',
    body: 'We repair everything we make, forever, at no charge. Because the moment a brand stops standing behind its work, it has admitted that the work was not worth standing behind.',
    svg: (
      <svg className="vic" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const teamMembers = [
  {
    name: 'Margaux Leconte',
    role: 'Co-Founder & Creative Director',
    tag: 'Co-Founder',
    bio: 'Trained at Ecole de la Chambre Syndicale. Fifteen years of pattern-cutting before Atelier. Still the first person in the workshop each morning.',
    className: 'bm1',
  },
  {
    name: 'Theo Leconte',
    role: 'Co-Founder & Head of Sourcing',
    tag: 'Co-Founder',
    bio: 'Former textile researcher. Knows every mill within 200km of Paris. Visits each one in person, every season, without exception.',
    className: 'bm2',
  },
  {
    name: 'Isabelle Roux',
    role: 'Head Tailor',
    tag: 'Head Tailor',
    bio: 'Thirty-two years of tailoring. Trained under three couture houses before joining Atelier in 2016. Author of our double-set seam standard.',
    className: 'bm3',
  },
  {
    name: 'Noah Girard',
    role: 'Sustainability & B Corp Lead',
    tag: 'Sustainability',
    bio: 'Environmental scientist turned fashion advocate. Designed our zero-waste system. Reduced our carbon footprint by 62% in five years.',
    className: 'bm4',
  },
];

export default function About() {
  const content = usePageContent('about');

  useEffect(() => {
    document.title = 'ATELIER - Our Story';
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
            2014
          </div>
          <div className="hero-txt">
            <div className="eyebrow">{content.eyebrow}</div>
            <h1 className="hero-h1">
              {lines(content.title).map((line, index) => (
                index === lines(content.title).length - 1
                  ? <em key={line}>{line}</em>
                  : <span key={line}>{line}<br /></span>
              ))}
            </h1>
            <div className="hero-stats">
              <div>
                <span className="sv">12</span>
                <span className="sl">Artisans</span>
              </div>
              <div>
                <span className="sv">200km</span>
                <span className="sl">Sourcing radius</span>
              </div>
              <div>
                <span className="sv">0%</span>
                <span className="sl">Waste</span>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-r">
          <blockquote className="hero-quote">{content.quote}</blockquote>
          <p className="hero-attr">{content.quoteBy}</p>
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
          <div className="sec-ey">{content.originEyebrow}</div>
          <h2 className="orig-h">
            {lines(content.originTitle).map((line) => <span key={line}>{line}<br /></span>)}
          </h2>
          <div className="orig-body">
            <p>
              In the autumn of 2014, Margaux and Theo Leconte rented a 40-square-metre workshop on the Rue du Faubourg
              Saint-Honore with one sewing machine, two chairs, and a conviction that fashion had forgotten how to be
              patient.
            </p>
            <blockquote className="pull">
              "We wanted to make twelve things beautifully - not a thousand things adequately."
            </blockquote>
            <p>
              Their first collection was twelve pieces. Each was cut by hand from fabric sourced within two hours of
              Paris. Each seam was set twice. The collection sold out in eleven days - not through advertising, but
              through word of mouth between people who understood what they were holding.
            </p>
            <p>
              A decade later, we still produce twelve pieces per silhouette, per season. The workshop is larger. The
              team is twelve strong. The conviction has not changed by a stitch.
            </p>
          </div>
        </div>
        <div className="img-stack">
          <div className="img-main">
            <span className="img-lbl">The original atelier, 2014</span>
          </div>
          <div className="img-fl">
            <span className="img-fl-l">First collection</span>
          </div>
          <p className="img-cap">
            Margaux and Theo at their first cutting table - a door laid across two sawhorses. They still use it.
          </p>
        </div>
      </section>

      <section className="tl-section">
        <div className="tl-head">
          <div className="sec-ey" style={{ marginBottom: 0 }}>
            {content.timelineEyebrow}
          </div>
          <h2 className="tl-h">{content.timelineTitle}</h2>
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
          <div className="vals-ey">{content.valuesEyebrow}</div>
          <h2 className="vals-h">{content.valuesTitle}</h2>
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
        <div className="mfst-lbl">{content.manifestoLabel}</div>
        <p className="mfst-txt">
          {content.manifestoText}
        </p>
        <p className="mfst-sig">Margaux Leconte</p>
        <p className="mfst-role">Co-Founder & Creative Director, Atelier</p>
      </section>

      <section className="team">
        <div className="team-hd">
          <h2 className="team-h">
            {lines(content.teamTitle).map((line) => <span key={line}>{line}<br /></span>)}
          </h2>
          <p className="team-d">{content.teamDescription}</p>
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
