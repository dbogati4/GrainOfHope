import { useEffect, useMemo, useState } from "react";
import { getCountryYearPredictions, getGlobalYearPredictions } from "../lib/api";

const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i); // 2025..2035
const nf = new Intl.NumberFormat("en-US");
const cf = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function Calculator() {
  // form state
  const [year, setYear] = useState(2030);
  const [country, setCountry] = useState("");
  const [donationUSD, setDonationUSD] = useState(10);
  const [baseCost, setBaseCost] = useState(0.8); // USD per person per day (editable)
  const [adjustByGHI, setAdjustByGHI] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.5); // 0..1

  // data
  const [countries, setCountries] = useState([]);
  const [ghiCountry, setGhiCountry] = useState(null);
  const [ghiGlobal, setGhiGlobal] = useState(null);
  const [err, setErr] = useState("");

  // loading flags
  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingData, setLoadingData] = useState(false);


  // Add near the top of Calculator.jsx
const DONATION_ORGS = [
  {
    name: "UN World Food Programme",
    blurb: "The UN’s frontline agency against global hunger.",
    href: "https://donate.wfp.org/1243/donation/regular/?campaign=1517&_ga=2.264509259.575144306.1755989457-1346917639.1755989457",
  },
  {
    name: "Action Against Hunger",
    blurb: "Treating and preventing life-threatening undernutrition.",
    href: "https://www.actionagainsthunger.org/take-action/donate/",
  },
  {
    name: "Save the Children",
    blurb: "Helping children survive and thrive in crisis.",
    href: "https://www.savethechildren.org/support",
  },
  {
    name: "UNICEF",
    blurb: "Delivering nutrition, water, health & protection for kids.",
    href: "https://help.unicef.org/",
  },
  {
    name: "Oxfam",
    blurb: "Fighting inequality, poverty, and hunger in 75+ countries.",
    href: "https://www.oxfamamerica.org/donate/",
  },
  {
    name: "Mercy Corps",
    blurb: "Emergency response & resilience in crisis regions.",
    href: "https://www.mercycorps.org/donate",
  },
  {
    name: "Feeding America (US)",
    blurb: "Supports a network of 200+ US food banks.",
    href: "https://give.feedingamerica.org/a/donate",
  },
  {
    name: "No Kid Hungry (US)",
    blurb: "Ending child hunger across the United States.",
    href: "https://www.nokidhungry.org/donate",
  },
];


  // Fetch a country list (simple: take countries from one year)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingInit(true);
        const rows = await getCountryYearPredictions({ year: 2030 });
        const safe = Array.isArray(rows) ? rows : [];
        const names = [...new Set(safe.map(r => r?.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        if (!alive) return;
        setCountries(names);
        if (!country && names.length) setCountry(names[0]);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e.message || "Failed to load country list.");
      } finally {
        if (alive) setLoadingInit(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch prediction for chosen country/year
  useEffect(() => {
    if (!country) return;
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoadingData(true);
        const [countryRows, globalRows] = await Promise.all([
          getCountryYearPredictions({ year, country: [country] }),
          getGlobalYearPredictions({ year }),
        ]);
        if (!alive) return;
        const c = Number((Array.isArray(countryRows) && countryRows[0]?.ghi_pred) ?? NaN);
        const g = Number((Array.isArray(globalRows) && globalRows[0]?.global_ghi_mean) ?? NaN);
        setGhiCountry(Number.isFinite(c) ? c : null);
        setGhiGlobal(Number.isFinite(g) ? g : null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e.message || "Failed to load prediction.");
        setGhiCountry(null);
        setGhiGlobal(null);
      } finally {
        if (alive) setLoadingData(false);
      }
    })();
    return () => { alive = false; };
  }, [country, year]);

  // Calculation
  const result = useMemo(() => {
    const donation = Math.max(0, Number(donationUSD) || 0);
    const cost = Math.max(0.01, Number(baseCost) || 0.01);

    let adjMult = 1;
    if (adjustByGHI && Number.isFinite(ghiCountry) && Number.isFinite(ghiGlobal)) {
      // adjust cost by relative need: higher-than-global GHI -> cost goes up a bit
      const diff = ghiCountry - ghiGlobal; // points
      adjMult = 1 + sensitivity * (diff / 100); // e.g., diff 20, sens 0.5 => +10%
      // clamp to reasonable range
      adjMult = Math.min(Math.max(adjMult, 0.5), 2.0);
    }

    const effectiveCost = cost * adjMult;
    const peopleFed = Math.floor(effectiveCost > 0 ? donation / effectiveCost : 0);

    return { adjMult, effectiveCost, peopleFed };
  }, [donationUSD, baseCost, adjustByGHI, sensitivity, ghiCountry, ghiGlobal]);

  const disabled = loadingInit || loadingData;

  return (
    <main className="content">
      <section className="section">
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Donation Impact Calculator</h2>
          {err && <p className="error">Error: {err}</p>}

          <div className="grid2">
            <div className="card">
              <h3>Inputs</h3>

              <div className="form-row">
                <label>Country</label>
                <select value={country} onChange={e => setCountry(e.target.value)} disabled={loadingInit}>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label>Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={disabled}>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label>Donation (USD)</label>
                <input
                  type="number" min="0" step="0.5" value={donationUSD}
                  onChange={e => setDonationUSD(e.target.value)}
                  disabled={disabled}
                />
              </div>

              <div className="form-row">
                <label>Cost per person per day (USD)</label>
                <input
                  type="number" min="0.01" step="0.01" value={baseCost}
                  onChange={e => setBaseCost(e.target.value)}
                  disabled={disabled}
                />
              </div>

              <div className="form-row check">
                <label>
                  <input
                    type="checkbox"
                    checked={adjustByGHI}
                    onChange={e => setAdjustByGHI(e.target.checked)}
                    disabled={disabled}
                  />{" "}
                  Adjust cost by GHI vs global
                </label>
              </div>

              <div className="form-row">
                <label>Sensitivity ({(sensitivity * 100).toFixed(0)}%)</label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={sensitivity}
                  onChange={e => setSensitivity(Number(e.target.value))}
                  disabled={!adjustByGHI || disabled}
                />
              </div>

              <p className="hint">
                Adjustment raises/lowers cost based on how the country’s predicted GHI compares to the global mean.
                It’s a simple heuristic—tune or disable if you prefer.
              </p>
            </div>

            <div className="card">
              <h3>Data Snapshot</h3>

              {loadingData ? (
                <div className="mini-grid">
                  <div className="mini skeleton" />
                  <div className="mini skeleton" />
                  <div className="mini skeleton" />
                  <div className="mini skeleton" />
                </div>
              ) : (
                <div className="mini-grid">
                  <div className="mini">
                    <div className="mini-label">Country GHI</div>
                    <div className="mini-val">{Number.isFinite(ghiCountry) ? ghiCountry.toFixed(1) : "—"}</div>
                  </div>
                  <div className="mini">
                    <div className="mini-label">Global mean</div>
                    <div className="mini-val">{Number.isFinite(ghiGlobal) ? ghiGlobal.toFixed(1) : "—"}</div>
                  </div>
                  <div className="mini">
                    <div className="mini-label">Adj. multiplier</div>
                    <div className="mini-val">{result.adjMult.toFixed(2)}×</div>
                  </div>
                  <div className="mini">
                    <div className="mini-label">Effective cost</div>
                    <div className="mini-val">{cf.format(result.effectiveCost)}</div>
                  </div>
                </div>
              )}

              <div className="big-result">
                <div className="big-num">{nf.format(result.peopleFed)}</div>
                <div className="big-caption">people could be fed for one day</div>
                <div className="big-sub">
                  with {cf.format(Number(donationUSD || 0))} in {country || "—"} ({year})
                </div>
              </div>

              <p className="hint muted">
                Tip: try toggling the adjustment or changing sensitivity to explore scenarios.
              </p>
            </div>
          </div>

          <p className="disclaimer">
            This is an estimate for planning/awareness—actual costs vary by program, market prices, logistics, and policy.
          </p>
        </div>
      </section>
      {/* ===== Donate section ===== */}
<section className="section">
  <div className="panel">
    <h2 style={{ marginTop: 0 }}>Donate to Trusted Organizations</h2>
    <p className="muted" style={{ marginTop: 4, marginBottom: 12 }}>
      Choose a partner organization below. The Donate button opens their official page in a new tab.
    </p>

    <div className="donate-grid">
      {DONATION_ORGS.map((org) => (
        <div className="donate-card" key={org.name}>
          <div className="donate-title">{org.name}</div>
          <p className="donate-blurb">{org.blurb}</p>
          <a
            className="btn donate-btn"
            href={org.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Donate to ${org.name} (opens in a new tab)`}
          >
            Donate
          </a>
        </div>
      ))}
    </div>
  </div>
</section>

    </main>
  );
}
