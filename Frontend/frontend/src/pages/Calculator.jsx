import { useEffect, useMemo, useState } from "react";
import { getCountryYearPredictions, getGlobalYearPredictions } from "../lib/api";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LabelList
} from "recharts";

// ----- constants -----
const YEARS = Array.from({ length: 11 }, (_, i) => 2025 + i);        // 2025..2035 (top calculator)
const TREND_YEARS = Array.from({ length: 6 },  (_, i) => 2025 + i);  // 2025..2030 (before/after)
const nf = new Intl.NumberFormat("en-US");
const cf = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const Y_DOMAIN = [15, 20];                 // fixed axis like on Home
const Y_TICKS  = [15, 16, 17, 18, 19, 20];
const yFmt     = n => Number(n).toFixed(1);


const VISIBILITY_FACTORS = [
  { label: "x1", value: 1 },
  { label: "x10", value: 10 },
  { label: "x100", value: 100 },
  { label: "x1K", value: 1_000 },
  { label: "x100K", value: 100_000 },
  { label: "x1M", value: 1_000_000 },
];

// “illustrative impact” constants
const GLOBAL_POP = 8_000_000_000;  // ~8B
const WEIGHT_UNDERN = 0.33;        // rough weight of undernourishment in GHI

// donate cards
const DONATION_ORGS = [
  { name: "UN World Food Programme", blurb: "The UN’s frontline agency against global hunger.", href: "https://donate.wfp.org/1243/donation/regular/?campaign=1517&_ga=2.264509259.575144306.1755989457-1346917639.1755989457" },
  { name: "Action Against Hunger",   blurb: "Treating and preventing life-threatening undernutrition.", href: "https://www.actionagainsthunger.org/take-action/donate/" },
  { name: "Save the Children",       blurb: "Helping children survive and thrive in crisis.", href: "https://www.savethechildren.org/support" },
  { name: "UNICEF",                  blurb: "Delivering nutrition, water, health & protection for kids.", href: "https://help.unicef.org/" },
  { name: "Oxfam",                   blurb: "Fighting inequality, poverty, and hunger in 75+ countries.", href: "https://www.oxfamamerica.org/donate/" },
  { name: "Mercy Corps",             blurb: "Emergency response & resilience in crisis regions.", href: "https://www.mercycorps.org/donate" },
  { name: "Feeding America (US)",    blurb: "Supports a network of 200+ US food banks.", href: "https://give.feedingamerica.org/a/donate" },
  { name: "No Kid Hungry (US)",      blurb: "Ending child hunger across the United States.", href: "https://www.nokidhungry.org/donate" },
];

export default function Calculator() {
  // ----- top calculator state -----
  const [year, setYear] = useState(2026);
  const [country, setCountry] = useState("");
  const [donationUSD, setDonationUSD] = useState(10);
  const [baseCost, setBaseCost] = useState(0.8); // USD per person per day
  const [adjustByGHI, setAdjustByGHI] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.5); // 0..1

  const [countries, setCountries] = useState([]);
  const [ghiCountry, setGhiCountry] = useState(null);
  const [ghiGlobal,  setGhiGlobal]  = useState(null);
  const [err, setErr] = useState("");

  const [loadingInit, setLoadingInit] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // ----- before/after section state -----
  const [baseline, setBaseline] = useState([]);
  const [trendErr, setTrendErr] = useState("");
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [impactElasticity, setImpactElasticity] = useState(0.3); // 0..1 (illustrative)
  const [visibility, setVisibility] = useState(100);             // visual zoom

  // countries list (simple: pull from one year)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoadingInit(true);
        const rows = await getCountryYearPredictions({ year: 2030 });
        const names = [...new Set((rows || []).map(r => r?.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
        if (!alive) return;
        setCountries(names);
        if (!country && names.length) setCountry(names[0]);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e.message || "Failed to load countries.");
      } finally {
        if (alive) setLoadingInit(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // snapshot numbers for selected country/year
  useEffect(() => {
    if (!country) return;
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoadingData(true);
        const [cRows, gRows] = await Promise.all([
          getCountryYearPredictions({ year, country: [country] }),
          getGlobalYearPredictions({ year }),
        ]);
        if (!alive) return;
        const c = Number((cRows?.[0]?.ghi_pred) ?? NaN);
        const g = Number((gRows?.[0]?.global_ghi_mean) ?? NaN);
        setGhiCountry(Number.isFinite(c) ? c : null);
        setGhiGlobal(Number.isFinite(g) ? g : null);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.detail || e.message || "Failed to load prediction.");
        setGhiCountry(null); setGhiGlobal(null);
      } finally {
        if (alive) setLoadingData(false);
      }
    })();
    return () => { alive = false; };
  }, [country, year]);

  // baseline global trend for the before/after charts
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setTrendErr("");
        setLoadingTrend(true);
        const rows = await getGlobalYearPredictions({
          start_year: TREND_YEARS[0],
          end_year:   TREND_YEARS[TREND_YEARS.length - 1],
        });
        if (!alive) return;
        const ok = (rows || []).map(r => ({ year: Number(r.year), global_ghi_mean: Number(r.global_ghi_mean) }));
        setBaseline(ok);
      } catch (e) {
        if (!alive) return;
        setTrendErr(e?.response?.data?.detail || e.message || "Failed to load baseline trend.");
        const v = Number.isFinite(Number(ghiGlobal)) ? Number(ghiGlobal) : 16.5;
        setBaseline(TREND_YEARS.map(y => ({ year: y, global_ghi_mean: v })));
      } finally {
        if (alive) setLoadingTrend(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // top “snapshot” calculation
  const snapshot = useMemo(() => {
    const donation = Math.max(0, Number(donationUSD) || 0);
    const cost = Math.max(0.01, Number(baseCost) || 0.01);

    let adjMult = 1;
    if (adjustByGHI && Number.isFinite(ghiCountry) && Number.isFinite(ghiGlobal)) {
      const diff = Number(ghiCountry ?? NaN) - Number(ghiGlobal ?? NaN);
      adjMult = 1 + sensitivity * (diff / 100);
      adjMult = Math.min(Math.max(adjMult, 0.5), 2);
    }

    const effectiveCost = cost * adjMult;
    const peopleFed = Math.floor(effectiveCost > 0 ? donation / effectiveCost : 0);
    return { adjMult, effectiveCost, peopleFed };
  }, [donationUSD, baseCost, adjustByGHI, sensitivity, ghiCountry, ghiGlobal]);

  // before/after series (computed inside component)
  const beforeSeries = useMemo(() => baseline, [baseline]);

  const afterSeries = useMemo(() => {
    if (!baseline.length) return [];
    const cost = Math.max(0.01, Number(baseCost) || 0.01);

    let adjMult = 1;
    if (adjustByGHI && Number.isFinite(ghiCountry) && Number.isFinite(ghiGlobal)) {
      const diff = Number(ghiCountry ?? NaN) - Number(ghiGlobal ?? NaN);
      adjMult = 1 + sensitivity * (diff / 100);
      adjMult = Math.min(Math.max(adjMult, 0.5), 2);
    }

    const effectiveCost = cost * adjMult;
    const peopleDays = effectiveCost > 0 ? (Number(donationUSD) || 0) / effectiveCost : 0;

    // tiny GHI delta, then scaled by visibility for presentation
    const PD_PER_POINT = 1e8;
    const rawDeltaPts  = impactElasticity * (peopleDays / PD_PER_POINT);
    const visibleDelta = rawDeltaPts * visibility;

    return baseline.map(r => ({
      year: r.year,
      global_ghi_mean: r.year >= year ? Math.max(0, r.global_ghi_mean - visibleDelta) : r.global_ghi_mean,
    }));
  }, [baseline, year, donationUSD, baseCost, adjustByGHI, sensitivity, ghiCountry, ghiGlobal, impactElasticity, visibility]);

  const yDomain = useMemo(() => {
    const vals = [...beforeSeries, ...afterSeries]
      .map(d => d.global_ghi_mean)
      .filter(v => Number.isFinite(v));
    if (!vals.length) return [15, 18];
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const pad = Math.max(0.05, (mx - mn) * 0.08);
    return [Math.min(15, mn - pad), Math.max(18, mx + pad)];
  }, [beforeSeries, afterSeries]);

  const disabled = loadingInit || loadingData;

  return (
    <main className="content">
      {/* ===== Donation Impact Calculator ===== */}
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
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label>Year</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} disabled={disabled}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="form-row">
                <label>Donation (USD)</label>
                <input type="number" min="0" step="0.5" value={donationUSD}
                       onChange={e => setDonationUSD(e.target.value)} disabled={disabled} />
              </div>

              <div className="form-row">
                <label>Cost per person per day (USD)</label>
                <input type="number" min="0.01" step="0.01" value={baseCost}
                       onChange={e => setBaseCost(e.target.value)} disabled={disabled} />
              </div>

              <div className="form-row check">
                <label>
                  <input type="checkbox" checked={adjustByGHI}
                         onChange={e => setAdjustByGHI(e.target.checked)} disabled={disabled} />{" "}
                  Adjust cost by GHI vs global
                </label>
              </div>

              <div className="form-row">
                <label>Sensitivity ({(sensitivity * 100).toFixed(0)}%)</label>
                <input type="range" min="0" max="1" step="0.05" value={sensitivity}
                       onChange={e => setSensitivity(Number(e.target.value))}
                       disabled={!adjustByGHI || disabled} />
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
                  <div className="mini"><div className="mini-label">Country GHI</div><div className="mini-val">{Number.isFinite(ghiCountry) ? Number(ghiCountry).toFixed(1) : "—"}</div></div>
                  <div className="mini"><div className="mini-label">Global mean</div><div className="mini-val">{Number.isFinite(ghiGlobal) ? Number(ghiGlobal).toFixed(1) : "—"}</div></div>
                  <div className="mini"><div className="mini-label">Adj. multiplier</div><div className="mini-val">{snapshot.adjMult.toFixed(2)}×</div></div>
                  <div className="mini"><div className="mini-label">Effective cost</div><div className="mini-val">{cf.format(snapshot.effectiveCost)}</div></div>
                </div>
              )}

              <div className="big-result">
                <div className="big-num">{nf.format(snapshot.peopleFed)}</div>
                <div className="big-caption">people could be fed for one day</div>
                <div className="big-sub">
                  with {cf.format(Number(donationUSD || 0))} in {country || "—"} ({year})
                </div>
              </div>

              <p className="hint muted">Tip: try toggling the adjustment or changing sensitivity to explore scenarios.</p>
            </div>
          </div>

          <p className="disclaimer">
            This is an estimate for planning/awareness—actual costs vary by program, market prices, logistics, and policy.
          </p>
        </div>
      </section>

      {/* ===== Before vs After (illustrative) ===== */}
      <section className="section">
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Projected GHI with Your Donation (illustrative)</h2>

          <div className="controls-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
            <div>
              <label className="lbl">Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Year</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Donation (USD)</label>
              <input type="number" min="0" step="0.5" value={donationUSD} onChange={e => setDonationUSD(e.target.value)} />
            </div>
            <div style={{ minWidth: 220 }}>
              <label className="lbl">Impact elasticity ({Math.round(impactElasticity * 100)}%)</label>
              <input type="range" min="0" max="1" step="0.05"
                     value={impactElasticity} onChange={e => setImpactElasticity(Number(e.target.value))} />
            </div>
            <div>
              <label className="lbl">Visibility zoom</label>
              <select value={visibility} onChange={e => setVisibility(Number(e.target.value))}>
                {VISIBILITY_FACTORS.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {trendErr && <p className="error">Trend data: {trendErr}</p>}

          <div className="charts-two">
            {/* Before */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Before (baseline model)</h3>
              <div className="chart-wrap" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={beforeSeries} margin={{ left: 12, right: 12, top: 10, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis
                      domain={Y_DOMAIN}
                      ticks={Y_TICKS}
                      tickFormatter={yFmt}
                      label={{ value: "GHI", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="global_ghi_mean" name="Year (baseline)" stroke="#111" strokeWidth={3} dot={{ r: 3 }}>
                      <LabelList dataKey="global_ghi_mean" position="top" formatter={v => Number(v).toFixed(1)} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* After */}
            <div className="card">
              <h3 style={{ marginTop: 0 }}>After (with your donation)</h3>
              <div className="chart-wrap" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={afterSeries} margin={{ left: 12, right: 12, top: 10, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis
                      domain={Y_DOMAIN}
                      ticks={Y_TICKS}
                      tickFormatter={yFmt}
                      label={{ value: "GHI", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="global_ghi_mean" name="Year (after)" stroke="#16a34a" strokeWidth={3} dot={{ r: 3 }}>
                      <LabelList dataKey="global_ghi_mean" position="top" formatter={v => Number(v).toFixed(1)} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <p className="hint muted" style={{ marginTop: 8 }}>
            We convert your donation into meal-days using the cost you set above, then nudge the undernourishment component of the
            Global Hunger Index a very small amount from the selected year onward. The change is <strong>illustrative</strong> and
            scaled by “visibility”. Real outcomes depend on program delivery, prices, policy, and many other factors.
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
            {DONATION_ORGS.map(org => (
              <div className="donate-card" key={org.name}>
                <div className="donate-title">{org.name}</div>
                <p className="donate-blurb">{org.blurb}</p>
                <a className="btn donate-btn" href={org.href} target="_blank" rel="noopener noreferrer"
                   aria-label={`Donate to ${org.name} (opens in a new tab)`}>
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
