import { Fragment, useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer/Footer.jsx';
import featuredEditorial from '../assets/featured-editorial.jpg';
import lookbook from '../assets/lookbook.jpg';
import api from '../services/api.js';

function EditableText({ as: Tag = 'span', className = '', value, isAdmin, onSave, children }) {
  if (!isAdmin) {
    return <Tag className={className}>{children ?? value}</Tag>;
  }

  return (
    <Tag
      className={`${className} cms-editable-text`}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(event) => onSave(event.currentTarget.innerText)}
    >
      {value}
    </Tag>
  );
}

function EditableCta({ text, href, isAdmin, onTextSave }) {
  return (
    <span className="cms-cta-wrap">
      <a
        href={href || '#'}
        className="cta-button"
        onClick={(event) => {
          if (isAdmin) event.preventDefault();
        }}
      >
        <EditableText as="span" value={text} isAdmin={isAdmin} onSave={onTextSave} />
      </a>
    </span>
  );
}

function EditableImage({ src, fallback, alt, label, isAdmin, onUpload, onLabelSave, labelClassName = 'hero-image-label' }) {
  const imageSrc = src || fallback;

  return (
    <div className={`cms-image-edit ${isAdmin ? 'is-admin' : ''}`}>
      {imageSrc && <img src={imageSrc} alt={alt} />}
      <EditableText
        as="div"
        className={labelClassName}
        value={label}
        isAdmin={isAdmin}
        onSave={onLabelSave}
      />
      {isAdmin && (
        <label className="cms-image-button">
          Change Image
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
              event.target.value = '';
            }}
          />
        </label>
      )}
    </div>
  );
}

export default function Home({ isAdmin = false }) {
  const [content, setContent] = useState(null);
  const [saveState, setSaveState] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/cms')
      .then((response) => {
        if (active) setContent(response.data);
      })
      .catch(() => {
        if (active) setContent(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const saveCmsPatch = async (patch) => {
    if (!isAdmin) return;
    const next = { ...(content || {}), ...patch };
    setContent(next);
    setSaveState('Saving');
    try {
      const response = await api.put('/cms', next);
      setContent(response.data);
      setSaveState('Saved');
    } catch {
      setSaveState('Could not save');
    }
  };

  const uploadCmsImage = async (field, file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      setSaveState('Uploading');
      try {
        const response = await api.post('/content/upload', { image: reader.result });
        await saveCmsPatch({ [field]: response.data.url });
      } catch {
        setSaveState('Could not upload');
      }
    };
    reader.readAsDataURL(file);
  };

  if (!content) return null;

  const heroTitle = content.heroTitle;
  const heroLines = heroTitle.split('\n');

  return (
    <div className={isAdmin ? 'cms-mode' : undefined}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Archivo:wght@300;400;600&display=swap');

        :root {
          --cream: #faf7f2;
          --charcoal: #1a1a1a;
          --Ash: #8f9390;
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
          color: var(--Ash);
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
          background: var(--Ash);
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

        .cms-mode .cms-editable-text {
          outline: 1px dashed rgba(143, 147, 144, 0.65);
          outline-offset: 6px;
          border-radius: 2px;
          cursor: text;
          white-space: pre-line;
          transition: outline-color 0.2s ease, background 0.2s ease;
        }

        .cms-mode .cms-editable-text:hover,
        .cms-mode .cms-editable-text:focus {
          outline-color: var(--charcoal);
          background: rgba(250, 247, 242, 0.18);
        }

        .cms-status {
          position: fixed;
          right: 1rem;
          bottom: 1rem;
          z-index: 1000;
          padding: 0.7rem 0.9rem;
          background: rgba(26, 26, 26, 0.86);
          color: var(--cream);
          font-size: 0.68rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .cms-cta-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.75rem;
          width: fit-content;
        }

        .cms-image-edit {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .cms-image-edit.is-admin {
          outline: 1px dashed rgba(250, 247, 242, 0.8);
          outline-offset: -10px;
        }

        .cms-image-button {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          padding: 0.78rem 1rem;
          border: 1px solid var(--cream);
          background: rgba(26, 26, 26, 0.72);
          color: var(--cream);
          cursor: pointer;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: opacity 0.2s ease;
          z-index: 5;
        }

        .cms-image-button input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .cms-image-edit.is-admin:hover .cms-image-button {
          opacity: 1;
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
            radial-gradient(circle at 20% 50%, rgba(143, 147, 144, 0.1) 0%, transparent 50%),
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
          color: var(--Ash);
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

        .collection-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .collection-image-label {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: rgba(26, 26, 26, 0.45);
          text-align: center;
        }

        .collection-image::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--Ash);
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
          background: var(--Ash);
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
          color: var(--Ash);
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
          background: var(--Ash);
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
          background: var(--Ash);
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
          color: var(--Ash);
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
          content: attr(data-process-label);
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
          color: var(--Ash);
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
          color: rgba(143, 147, 144, 0.5);
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
      {isAdmin && <div className="cms-status">{saveState || 'Visual CMS'}</div>}
      <Header />

      <section className="hero">
        <div className="hero-left">
          <EditableText
            as="div"
            className="hero-label"
            value={content.heroLabel}
            isAdmin={isAdmin}
            onSave={(value) => saveCmsPatch({ heroLabel: value })}
          />
          {isAdmin ? (
            <EditableText
              as="h1"
              className="hero-title"
              value={heroTitle}
              isAdmin={isAdmin}
              onSave={(value) => saveCmsPatch({ heroTitle: value })}
            />
          ) : (
            <h1 className="hero-title">
              {heroLines.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < heroLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
          )}
          <EditableText
            as="p"
            className="hero-description"
            value={content.heroSubtitle}
            isAdmin={isAdmin}
            onSave={(value) => saveCmsPatch({ heroSubtitle: value })}
          />
          <EditableCta
            text={content.buttonText}
            href={content.buttonLink}
            isAdmin={isAdmin}
            onTextSave={(value) => saveCmsPatch({ buttonText: value })}
          />
        </div>
        <div className="hero-right">
          <div className="hero-image-stack">
            <div className="hero-image">
              <EditableImage
                src={content?.heroImage}
                fallback={featuredEditorial}
                alt="Featured editorial"
                label={content.primaryImageLabel}
                isAdmin={isAdmin}
                onUpload={(file) => uploadCmsImage('heroImage', file)}
                onLabelSave={(value) => saveCmsPatch({ primaryImageLabel: value })}
              />
            </div>
            <div className="hero-image">
              <EditableImage
                src={content?.heroImageSecondary}
                fallback={lookbook}
                alt="Boo Thing lookbook"
                label={content.secondaryImageLabel}
                isAdmin={isAdmin}
                onUpload={(file) => uploadCmsImage('heroImageSecondary', file)}
                onLabelSave={(value) => saveCmsPatch({ secondaryImageLabel: value })}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section" id="collections">
        <div className="section-header">
          <EditableText
            as="div"
            className="section-subtitle"
            value={content.sectionSubtitle}
            isAdmin={isAdmin}
            onSave={(value) => saveCmsPatch({ sectionSubtitle: value })}
          />
          <EditableText
            as="h2"
            className="section-title"
            value={content.section2Title}
            isAdmin={isAdmin}
            onSave={(value) => saveCmsPatch({ section2Title: value })}
          />
        </div>
        <div className="collection-grid">
          <div className="collection-item">
            <div className="collection-image">
              <EditableImage
                src={content.productOneImage}
                alt={content.productOneImageLabel}
                label={content.productOneImageLabel}
                isAdmin={isAdmin}
                labelClassName="collection-image-label"
                onUpload={(file) => uploadCmsImage('productOneImage', file)}
                onLabelSave={(value) => saveCmsPatch({ productOneImageLabel: value })}
              />
            </div>
            <div className="collection-info">
              <EditableText as="h3" className="collection-name" value={content.productOneName} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ productOneName: value })} />
              <EditableText as="p" className="collection-price" value={content.productOnePrice} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ productOnePrice: value })} />
            </div>
          </div>
          <div className="collection-item">
            <div className="collection-image">
              <EditableImage
                src={content.productTwoImage}
                alt={content.productTwoImageLabel}
                label={content.productTwoImageLabel}
                isAdmin={isAdmin}
                labelClassName="collection-image-label"
                onUpload={(file) => uploadCmsImage('productTwoImage', file)}
                onLabelSave={(value) => saveCmsPatch({ productTwoImageLabel: value })}
              />
            </div>
            <div className="collection-info">
              <EditableText as="h3" className="collection-name" value={content.productTwoName} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ productTwoName: value })} />
              <EditableText as="p" className="collection-price" value={content.productTwoPrice} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ productTwoPrice: value })} />
            </div>
          </div>
          <div className="collection-item">
            <div className="collection-image">
              <EditableImage
                src={content.productThreeImage}
                alt={content.productThreeImageLabel}
                label={content.productThreeImageLabel}
                isAdmin={isAdmin}
                labelClassName="collection-image-label"
                onUpload={(file) => uploadCmsImage('productThreeImage', file)}
                onLabelSave={(value) => saveCmsPatch({ productThreeImageLabel: value })}
              />
            </div>
            <div className="collection-info">
              <EditableText as="h3" className="collection-name" value={content.productThreeName} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ productThreeName: value })} />
              <EditableText as="p" className="collection-price" value={content.productThreePrice} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ productThreePrice: value })} />
            </div>
          </div>
        </div>
      </section>

      <section className="statement-section" id="about">
        <div className="marquee-strip" aria-hidden="true">
          <div className="marquee-inner">
            {[...Array(2)].map((_, round) => (
              ['marqueeOne', 'marqueeTwo', 'marqueeThree', 'marqueeFour', 'marqueeFive', 'marqueeSix'].map((key) => (
                <span key={`${round}-${key}`}>
                  <EditableText
                    value={content[key]}
                    isAdmin={isAdmin}
                    onSave={(value) => saveCmsPatch({ [key]: value })}
                  />
                  <span className="dot">&middot;</span>
                </span>
              ))
            ))}
          </div>
        </div>

        <div className="pillars-section">
          <div className="pillars-header">
            <EditableText as="span" className="pillars-label" value={content.principlesLabel} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ principlesLabel: value })} />
            <EditableText as="h2" className="pillars-title" value={content.principlesTitle} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ principlesTitle: value })} />
          </div>
          <div className="pillars-grid">
            {[
              ['One', 'pillarOneIndex', 'pillarOneTitle', 'pillarOneBody', 'pillarOneLink'],
              ['Two', 'pillarTwoIndex', 'pillarTwoTitle', 'pillarTwoBody', 'pillarTwoLink'],
              ['Three', 'pillarThreeIndex', 'pillarThreeTitle', 'pillarThreeBody', 'pillarThreeLink'],
            ].map(([name, indexKey, titleKey, bodyKey, linkKey]) => (
              <div className="pillar-card" key={name}>
                <EditableText as="span" className="pillar-index" value={content[indexKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [indexKey]: value })} />
                <div className="pillar-icon-line" />
                <EditableText as="h3" className="pillar-name" value={content[titleKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [titleKey]: value })} />
                <EditableText as="p" className="pillar-body" value={content[bodyKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [bodyKey]: value })} />
                <a href="#" className="pillar-read-more" onClick={(event) => isAdmin && event.preventDefault()}>
                  <EditableText value={content[linkKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [linkKey]: value })} />
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="process-strip" data-process-label={content.processBackground}>
          <div className="process-steps">
            {[
              ['processOneIndex', 'processOneTitle', 'processOneNote'],
              ['processTwoIndex', 'processTwoTitle', 'processTwoNote'],
              ['processThreeIndex', 'processThreeTitle', 'processThreeNote'],
              ['processFourIndex', 'processFourTitle', 'processFourNote'],
              ['processFiveIndex', 'processFiveTitle', 'processFiveNote'],
            ].map(([indexKey, titleKey, noteKey], index, items) => (
              <Fragment key={indexKey}>
                <div className="process-step">
                  <EditableText as="span" className="process-index" value={content[indexKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [indexKey]: value })} />
                  <EditableText as="span" className="process-name" value={content[titleKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [titleKey]: value })} />
                  <EditableText as="p" className="process-note" value={content[noteKey]} isAdmin={isAdmin} onSave={(value) => saveCmsPatch({ [noteKey]: value })} />
                </div>
                {index < items.length - 1 && <div className="process-arrow">&rarr;</div>}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}







