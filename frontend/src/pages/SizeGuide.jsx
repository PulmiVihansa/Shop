import { useMemo, useState } from 'react';
import '../styles/sizeguide.css';

const womenRows = [
  {
    size: 'XS',
    eu: '32-34',
    uk: '4-6',
    us: '0-2',
    bust: { cm: '80-84', in: '31.5-33' },
    waist: { cm: '60-64', in: '23.5-25' },
    hips: { cm: '86-90', in: '34-35.5' },
  },
  {
    size: 'S',
    eu: '36-38',
    uk: '8-10',
    us: '4-6',
    bust: { cm: '84-88', in: '33-34.5' },
    waist: { cm: '64-68', in: '25-27' },
    hips: { cm: '90-94', in: '35.5-37' },
  },
  {
    size: 'M',
    eu: '38-40',
    uk: '10-12',
    us: '6-8',
    bust: { cm: '88-92', in: '34.5-36' },
    waist: { cm: '68-72', in: '27-28.5' },
    hips: { cm: '94-98', in: '37-38.5' },
    highlight: true,
  },
  {
    size: 'L',
    eu: '40-42',
    uk: '12-14',
    us: '8-10',
    bust: { cm: '92-96', in: '36-38' },
    waist: { cm: '72-76', in: '28.5-30' },
    hips: { cm: '98-102', in: '38.5-40' },
  },
  {
    size: 'XL',
    eu: '42-44',
    uk: '14-16',
    us: '10-12',
    bust: { cm: '96-100', in: '38-39.5' },
    waist: { cm: '76-80', in: '30-31.5' },
    hips: { cm: '102-106', in: '40-41.5' },
  },
  {
    size: 'XXL',
    eu: '44-46',
    uk: '16-18',
    us: '12-14',
    bust: { cm: '100-106', in: '39.5-42' },
    waist: { cm: '80-86', in: '31.5-34' },
    hips: { cm: '106-112', in: '42-44' },
  },
];

const menRows = [
  {
    size: 'S',
    eu: '44-46',
    uk: '34-36',
    chest: { cm: '86-92', in: '34-36' },
    waist: { cm: '74-80', in: '29-31.5' },
    shoulder: { cm: '42-44', in: '16.5-17.5' },
  },
  {
    size: 'M',
    eu: '46-48',
    uk: '36-38',
    chest: { cm: '92-98', in: '36-38.5' },
    waist: { cm: '80-86', in: '31.5-34' },
    shoulder: { cm: '44-46', in: '17.5-18' },
  },
  {
    size: 'L',
    eu: '48-50',
    uk: '38-40',
    chest: { cm: '98-104', in: '38.5-41' },
    waist: { cm: '86-92', in: '34-36' },
    shoulder: { cm: '46-48', in: '18-19' },
    highlight: true,
  },
  {
    size: 'XL',
    eu: '50-52',
    uk: '40-42',
    chest: { cm: '104-110', in: '41-43.5' },
    waist: { cm: '92-98', in: '36-38.5' },
    shoulder: { cm: '48-50', in: '19-19.5' },
  },
  {
    size: 'XXL',
    eu: '52-54',
    uk: '42-44',
    chest: { cm: '110-116', in: '43.5-45.5' },
    waist: { cm: '98-104', in: '38.5-41' },
    shoulder: { cm: '50-52', in: '19.5-20.5' },
  },
];

const shoeRows = [
  { eu: '36', ukW: '3', ukM: '-', usW: '5.5', usM: '-', foot: { cm: '22.5', in: '8.9' } },
  { eu: '37', ukW: '4', ukM: '-', usW: '6.5', usM: '-', foot: { cm: '23.5', in: '9.3' } },
  { eu: '38', ukW: '5', ukM: '-', usW: '7.5', usM: '-', foot: { cm: '24', in: '9.4' } },
  { eu: '39', ukW: '6', ukM: '-', usW: '8.5', usM: '-', foot: { cm: '24.5', in: '9.6' }, highlight: true },
  { eu: '40', ukW: '6.5', ukM: '6', usW: '9', usM: '7', foot: { cm: '25', in: '9.8' } },
  { eu: '41', ukW: '7.5', ukM: '7', usW: '10', usM: '8', foot: { cm: '25.5', in: '10' } },
  { eu: '42', ukW: '-', ukM: '8', usW: '-', usM: '9', foot: { cm: '26.5', in: '10.4' } },
  { eu: '43', ukW: '-', ukM: '9', usW: '-', usM: '10', foot: { cm: '27.5', in: '10.8' } },
  { eu: '44', ukW: '-', ukM: '10', usW: '-', usM: '11', foot: { cm: '28', in: '11' } },
];

const womenFitGuide = [
  { size: 'XS', bMin: 80, bMax: 84, wMin: 60, wMax: 64, hMin: 86, hMax: 90 },
  { size: 'S', bMin: 84, bMax: 88, wMin: 64, wMax: 68, hMin: 90, hMax: 94 },
  { size: 'M', bMin: 88, bMax: 92, wMin: 68, wMax: 72, hMin: 94, hMax: 98 },
  { size: 'L', bMin: 92, bMax: 96, wMin: 72, wMax: 76, hMin: 98, hMax: 102 },
  { size: 'XL', bMin: 96, bMax: 100, wMin: 76, wMax: 80, hMin: 102, hMax: 106 },
  { size: 'XXL', bMin: 100, bMax: 106, wMin: 80, wMax: 86, hMin: 106, hMax: 112 },
];

export default function SizeGuide() {
  const [activeTab, setActiveTab] = useState('women');
  const [unit, setUnit] = useState('cm');
  const [bust, setBust] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [fitResult, setFitResult] = useState(null);

  const fitNote = useMemo(
    () =>
      "Based on your measurements. Between sizes? Size up for a relaxed drape, or down for a closer fit. Our most popular women's size is M.",
    []
  );

  const handleFindSize = () => {
    const bustVal = parseFloat(bust) || 0;
    const waistVal = parseFloat(waist) || 0;
    const hipsVal = parseFloat(hips) || 0;

    if (!bustVal && !waistVal && !hipsVal) return;

    const toCm = (value) => (unit === 'in' ? value * 2.54 : value);
    const bCm = toCm(bustVal);
    const wCm = toCm(waistVal);
    const hCm = toCm(hipsVal);

    let bestScore = Infinity;
    let bestSize = 'M';

    womenFitGuide.forEach((size) => {
      let score = 0;
      if (bCm) score += Math.min(Math.abs(bCm - size.bMin), Math.abs(bCm - size.bMax));
      if (wCm) score += Math.min(Math.abs(wCm - size.wMin), Math.abs(wCm - size.wMax));
      if (hCm) score += Math.min(Math.abs(hCm - size.hMin), Math.abs(hCm - size.hMax));
      if (score < bestScore) {
        bestScore = score;
        bestSize = size.size;
      }
    });

    setFitResult(`We recommend: Size ${bestSize}`);
  };

  return (
    <div className="sizeguide-page">
      <header className="ph">
        <div className="ph-inner">
          <div>
            <div className="ey">Find your perfect fit</div>
            <h1 className="ph-h">
              Size
              <br />
              <em>Guide</em>
            </h1>
          </div>
          <div>
            <p className="ph-desc">
              All Atelier garments are cut generously and with movement in mind. If you&apos;re between sizes, we
              always recommend sizing up - our pieces are designed to drape, not constrict.
            </p>
            <div className="ph-note">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Still unsure?</strong> Email hello@atelier.com with your measurements and we&apos;ll personally
                recommend the right size for you.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="ctrl">
        <div className="tabs">
          {[
            { id: 'women', label: 'Women' },
            { id: 'men', label: 'Men' },
            { id: 'shoes', label: 'Footwear' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="unit-wrap">
          <span className="unit-lbl">Units:</span>
          <div className="unit-sw">
            <button
              type="button"
              className={`uopt ${unit === 'cm' ? 'active' : ''}`}
              onClick={() => setUnit('cm')}
            >
              CM
            </button>
            <button
              type="button"
              className={`uopt ${unit === 'in' ? 'active' : ''}`}
              onClick={() => setUnit('in')}
            >
              IN
            </button>
          </div>
        </div>
      </div>

      <div className="body">
        <div className="htom">
          <h2 className="htom-h">How to measure yourself</h2>
          <div className="mgrid">
            <div className="mc">
              <span className="mc-num">01</span>
              <div className="mc-ilu">
                <svg width="54" height="90" viewBox="0 0 54 90" fill="none" stroke="#D4CDC5" strokeWidth="1.3">
                  <ellipse cx="27" cy="18" rx="12" ry="16" />
                  <path d="M15 34 Q9 52 11 68 Q18 84 27 84 Q36 84 43 68 Q45 52 39 34" />
                  <line x1="7" y1="48" x2="47" y2="48" strokeDasharray="3,2" />
                  <text x="49" y="52" fontSize="7" fill="#D4CDC5" stroke="none">
                    B
                  </text>
                </svg>
              </div>
              <div className="mc-n">Bust / Chest</div>
              <p className="mc-d">
                Measure around the fullest part of your chest. Keep the tape parallel to the floor - comfortable, not
                tight.
              </p>
            </div>
            <div className="mc">
              <span className="mc-num">02</span>
              <div className="mc-ilu">
                <svg width="54" height="90" viewBox="0 0 54 90" fill="none" stroke="#D4CDC5" strokeWidth="1.3">
                  <ellipse cx="27" cy="18" rx="12" ry="16" />
                  <path d="M15 34 Q9 52 11 68 Q18 84 27 84 Q36 84 43 68 Q45 52 39 34" />
                  <line x1="13" y1="56" x2="41" y2="56" strokeDasharray="3,2" />
                </svg>
              </div>
              <div className="mc-n">Waist</div>
              <p className="mc-d">
                Measure around your natural waist - the narrowest part of your torso, roughly 2cm above your navel.
              </p>
            </div>
            <div className="mc">
              <span className="mc-num">03</span>
              <div className="mc-ilu">
                <svg width="54" height="90" viewBox="0 0 54 90" fill="none" stroke="#D4CDC5" strokeWidth="1.3">
                  <ellipse cx="27" cy="18" rx="12" ry="16" />
                  <path d="M15 34 Q9 52 11 68 Q18 84 27 84 Q36 84 43 68 Q45 52 39 34" />
                  <line x1="9" y1="66" x2="45" y2="66" strokeDasharray="3,2" />
                </svg>
              </div>
              <div className="mc-n">Hips</div>
              <p className="mc-d">
                Measure around the fullest part of your hips and seat, approximately 20-23cm below your natural waist.
              </p>
            </div>
            <div className="mc">
              <span className="mc-num">04</span>
              <div className="mc-ilu">
                <svg width="40" height="90" viewBox="0 0 40 90" fill="none" stroke="#D4CDC5" strokeWidth="1.3">
                  <line x1="20" y1="5" x2="20" y2="85" />
                  <line x1="10" y1="5" x2="30" y2="5" />
                  <line x1="10" y1="85" x2="30" y2="85" />
                  <path d="M20 28 Q30 36 28 52 Q26 68 20 74" strokeWidth="1" />
                </svg>
              </div>
              <div className="mc-n">Inseam</div>
              <p className="mc-d">
                From the crotch seam to the ankle bone along the inside of the leg. Best taken with a friend.
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'women' && (
          <div id="tw">
            <div className="ff">
              <div className="ff-in">
                <h2 className="ff-h">Fit Finder</h2>
                <p className="ff-sub">Enter your measurements and we&apos;ll suggest your Atelier size.</p>
                <div className="ff-row">
                  <div className="ff-f">
                    <label className="ff-l">
                      Bust (<span className="ul">{unit}</span>)
                    </label>
                    <input
                      type="number"
                      className="ff-i"
                      value={bust}
                      onChange={(event) => setBust(event.target.value)}
                      placeholder={unit === 'cm' ? 'e.g. 90' : 'e.g. 35.5'}
                    />
                  </div>
                  <div className="ff-f">
                    <label className="ff-l">
                      Waist (<span className="ul">{unit}</span>)
                    </label>
                    <input
                      type="number"
                      className="ff-i"
                      value={waist}
                      onChange={(event) => setWaist(event.target.value)}
                      placeholder={unit === 'cm' ? 'e.g. 70' : 'e.g. 27.5'}
                    />
                  </div>
                  <div className="ff-f">
                    <label className="ff-l">
                      Hips (<span className="ul">{unit}</span>)
                    </label>
                    <input
                      type="number"
                      className="ff-i"
                      value={hips}
                      onChange={(event) => setHips(event.target.value)}
                      placeholder={unit === 'cm' ? 'e.g. 96' : 'e.g. 37.5'}
                    />
                  </div>
                  <button className="ff-btn" type="button" onClick={handleFindSize}>
                    Find My Size -
                  </button>
                </div>
                <div className={`ff-res ${fitResult ? 'show' : ''}`}>
                  <div className="ff-sz">{fitResult || '-'}</div>
                  <div className="ff-nt">{fitResult ? fitNote : '-'}</div>
                </div>
              </div>
            </div>

            <div className="ts">
              <h3 className="ts-h">
                Women&apos;s Clothing <span className="ts-tag">Ready-to-Wear</span>
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>EU</th>
                    <th>UK</th>
                    <th>US</th>
                    <th>
                      Bust (<span className="us">{unit}</span>)
                    </th>
                    <th>
                      Waist (<span className="us">{unit}</span>)
                    </th>
                    <th>
                      Hips (<span className="us">{unit}</span>)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {womenRows.map((row) => (
                    <tr key={row.size} className={row.highlight ? 'hl' : ''}>
                      <td>{row.size}</td>
                      <td>{row.eu}</td>
                      <td>{row.uk}</td>
                      <td>{row.us}</td>
                      <td className="m">{row.bust[unit]}</td>
                      <td className="m">{row.waist[unit]}</td>
                      <td className="m">{row.hips[unit]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ts-note">
                All measurements in {unit === 'cm' ? 'centimetres' : 'inches'}. Our garments include 2-3cm ease.{' '}
                <span className="ts-highlight">Terracotta row</span> = our most popular size.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'men' && (
          <div id="tm">
            <div className="ts">
              <h3 className="ts-h">
                Men&apos;s Clothing <span className="ts-tag">Ready-to-Wear</span>
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>EU</th>
                    <th>UK/US</th>
                    <th>
                      Chest (<span className="us">{unit}</span>)
                    </th>
                    <th>
                      Waist (<span className="us">{unit}</span>)
                    </th>
                    <th>
                      Shoulder (<span className="us">{unit}</span>)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {menRows.map((row) => (
                    <tr key={row.size} className={row.highlight ? 'hl' : ''}>
                      <td>{row.size}</td>
                      <td>{row.eu}</td>
                      <td>{row.uk}</td>
                      <td className="m">{row.chest[unit]}</td>
                      <td className="m">{row.waist[unit]}</td>
                      <td className="m">{row.shoulder[unit]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ts-note">
                All measurements in {unit === 'cm' ? 'centimetres' : 'inches'}. Includes 2-3cm ease.{' '}
                <span className="ts-highlight">Terracotta row</span> = our most popular size.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'shoes' && (
          <div id="ts2">
            <div className="ts">
              <h3 className="ts-h">
                Footwear <span className="ts-tag">All Styles</span>
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>EU</th>
                    <th>UK Women</th>
                    <th>UK Men</th>
                    <th>US Women</th>
                    <th>US Men</th>
                    <th>
                      Foot Length (<span className="us">{unit}</span>)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shoeRows.map((row) => (
                    <tr key={row.eu} className={row.highlight ? 'hl' : ''}>
                      <td>{row.eu}</td>
                      <td>{row.ukW}</td>
                      <td>{row.ukM}</td>
                      <td>{row.usW}</td>
                      <td>{row.usM}</td>
                      <td className="m">{row.foot[unit]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ts-note">
                All footwear runs true to EU size. <span className="ts-highlight">Terracotta row</span> = our most
                popular size.
              </p>
            </div>
          </div>
        )}

        <div className="care">
          <h2 className="care-h">Caring for your Atelier pieces</h2>
          <div className="cgrid">
            <div className="cc">
              <svg className="cc-ic" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2 12 Q12 2 22 12" />
                <path d="M6 12v8a2 2 0 002 2h8a2 2 0 002-2v-8" />
              </svg>
              <div className="cc-n">Washing</div>
              <p className="cc-b">
                Cold wash, 30°C maximum. Turn inside out. Use a pH-neutral detergent. Never wring. Individual care
                labels are included with every garment.
              </p>
            </div>
            <div className="cc">
              <svg className="cc-ic" viewBox="0 0 24 24" aria-hidden="true">
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
              <div className="cc-n">Drying</div>
              <p className="cc-b">
                Lay flat to dry, away from direct sunlight. Never tumble dry. For knitwear, reshape while damp and dry
                on a clean towel.
              </p>
            </div>
            <div className="cc">
              <svg className="cc-ic" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v11a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
              <div className="cc-n">Storage</div>
              <p className="cc-b">
                Store folded, not hung, especially knitwear. Use cedar blocks. For seasonal storage, keep in a
                breathable cotton bag in a cool, dark place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
