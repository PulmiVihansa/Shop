import { useMemo, useState } from 'react';
import '../styles/sizeguide.css';

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
  { eu: '40', uk: '6', us: '7', foot: { cm: '25', in: '9.8' } },
  { eu: '41', uk: '7', us: '8', foot: { cm: '25.5', in: '10' } },
  { eu: '42', uk: '8', us: '9', foot: { cm: '26.5', in: '10.4' }, highlight: true },
  { eu: '43', uk: '9', us: '10', foot: { cm: '27.5', in: '10.8' } },
  { eu: '44', uk: '10', us: '11', foot: { cm: '28', in: '11' } },
  { eu: '45', uk: '11', us: '12', foot: { cm: '29', in: '11.4' } },
];

const menFitGuide = [
  { size: 'S', cMin: 86, cMax: 92, wMin: 74, wMax: 80, sMin: 42, sMax: 44 },
  { size: 'M', cMin: 92, cMax: 98, wMin: 80, wMax: 86, sMin: 44, sMax: 46 },
  { size: 'L', cMin: 98, cMax: 104, wMin: 86, wMax: 92, sMin: 46, sMax: 48 },
  { size: 'XL', cMin: 104, cMax: 110, wMin: 92, wMax: 98, sMin: 48, sMax: 50 },
  { size: 'XXL', cMin: 110, cMax: 116, wMin: 98, wMax: 104, sMin: 50, sMax: 52 },
];

export default function SizeGuide() {
  const [activeTab, setActiveTab] = useState('men');
  const [unit, setUnit] = useState('cm');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [shoulder, setShoulder] = useState('');
  const [fitResult, setFitResult] = useState(null);

  const fitNote = useMemo(
    () =>
      'Based on your measurements. Between sizes? Size up for a relaxed streetwear fit, or down for a sharper contemporary fit.',
    []
  );

  const handleFindSize = () => {
    const chestVal = parseFloat(chest) || 0;
    const waistVal = parseFloat(waist) || 0;
    const shoulderVal = parseFloat(shoulder) || 0;

    if (!chestVal && !waistVal && !shoulderVal) return;

    const toCm = (value) => (unit === 'in' ? value * 2.54 : value);
    const cCm = toCm(chestVal);
    const wCm = toCm(waistVal);
    const sCm = toCm(shoulderVal);

    let bestScore = Infinity;
    let bestSize = 'M';

    menFitGuide.forEach((size) => {
      let score = 0;
      if (cCm) score += Math.min(Math.abs(cCm - size.cMin), Math.abs(cCm - size.cMax));
      if (wCm) score += Math.min(Math.abs(wCm - size.wMin), Math.abs(wCm - size.wMax));
      if (sCm) score += Math.min(Math.abs(sCm - size.sMin), Math.abs(sCm - size.sMax));
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
              All Astravia garments are cut generously and with movement in mind. If you&apos;re between sizes, we
              always recommend sizing up - our pieces are designed to drape, not constrict.
            </p>
            <div className="ph-note">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Still unsure?</strong> Email hello@astravia.com with your measurements and we&apos;ll personally
                recommend the right size for you.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="ctrl">
        <div className="tabs">
          {[
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
              <div className="mc-n">Chest</div>
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
              <div className="mc-n">Shoulder</div>
              <p className="mc-d">
                Measure shoulder point to shoulder point across the back for a clean, structured fit.
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

        {activeTab === 'men' && (
          <div id="tm">
            <div className="ff">
              <div className="ff-in">
                <h2 className="ff-h">Fit Finder</h2>
                <p className="ff-sub">Enter your measurements and we&apos;ll suggest your Astravia menswear size.</p>
                <div className="ff-row">
                  <div className="ff-f">
                    <label className="ff-l">
                      Chest (<span className="ul">{unit}</span>)
                    </label>
                    <input
                      type="number"
                      className="ff-i"
                      value={chest}
                      onChange={(event) => setChest(event.target.value)}
                      placeholder={unit === 'cm' ? 'e.g. 98' : 'e.g. 38.5'}
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
                      Shoulder (<span className="ul">{unit}</span>)
                    </label>
                    <input
                      type="number"
                      className="ff-i"
                      value={shoulder}
                      onChange={(event) => setShoulder(event.target.value)}
                      placeholder={unit === 'cm' ? 'e.g. 46' : 'e.g. 18'}
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
                Men&apos;s Clothing <span className="ts-tag">Ready-to-Wear</span>
              </h3>
              <table>
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>EU</th>
                    <th>UK</th>
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
                All measurements in {unit === 'cm' ? 'centimetres' : 'inches'}. Our garments include 2-3cm ease.{' '}
                <span className="ts-highlight">Ash row</span> = our most popular size.
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
                    <th>UK</th>
                    <th>US</th>
                    <th>
                      Foot Length (<span className="us">{unit}</span>)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shoeRows.map((row) => (
                    <tr key={row.eu} className={row.highlight ? 'hl' : ''}>
                      <td>{row.eu}</td>
                      <td>{row.uk}</td>
                      <td>{row.us}</td>
                      <td className="m">{row.foot[unit]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="ts-note">
                All footwear runs true to EU size. <span className="ts-highlight">Ash row</span> = our most
                popular size.
              </p>
            </div>
          </div>
        )}

        <div className="care">
          <h2 className="care-h">Caring for your Astravia pieces</h2>
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
