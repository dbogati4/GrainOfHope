import { useEffect, useMemo, useState } from "react";
import { getCountryYearPredictions, getGlobalYearPredictions } from "../lib/api";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, LabelList, PieChart, Pie, Cell
} from "recharts";

const YEARS = Array.from({ length: 6 }, (_, i) => 2025 + i); // 2025..2030
const fmt1 = (n) => Number(n ?? 0).toFixed(1);

// prefer 15–18, but include all points if they fall outside
const domainPrefer15to18 = ([dataMin, dataMax]) => [
  Math.min(15, dataMin),
  Math.max(18, dataMax),
];
const yTickFmt = (n) => Number(n).toFixed(1);

export default function Home() {
  // --- global line chart ---
  const [globalData, setGlobalData] = useState([]);
  const [gErr, setGErr] = useState("");

  // --- top-12 bar chart (single year) ---
  const [year, setYear] = useState(2030);
  const [countryData, setCountryData] = useState([]);
  const [cErr, setCErr] = useState("");

  // --- new insight #1: biggest improvers 2025->2030 ---
  const [improvers, setImprovers] = useState([]);
  const [impErr, setImpErr] = useState("");

  // --- new insight #2: severity distribution (select year) ---
  const [distYear, setDistYear] = useState(2030);
  const [distData, setDistData] = useState([]);
  const [distErr, setDistErr] = useState("");

  // GLOBAL
  useEffect(() => {
    (async () => {
      try {
        setGErr("");
        const rows = await getGlobalYearPredictions({ start_year: 2025, end_year: 2030 });
        setGlobalData(rows.map(r => ({ year: Number(r.year), global_ghi_mean: Number(r.global_ghi_mean) })));
      } catch (e) { setGErr(e?.response?.data?.detail || e.message); }
    })();
  }, []);

  // COUNTRY (top 12 for chosen year)
  useEffect(() => {
    (async () => {
      try {
        setCErr("");
        const rows = await getCountryYearPredictions({ year });
        const top = [...rows]
          .map(r => ({ country: r.country, ghi_pred: Number(r.ghi_pred) }))
          .sort((a, b) => b.ghi_pred - a.ghi_pred)
          .slice(0, 12);
        setCountryData(top);
      } catch (e) { setCErr(e?.response?.data?.detail || e.message); }
    })();
  }, [year]);

  // IMPROVERS (2025 vs 2030)
  useEffect(() => {
    (async () => {
      try {
        setImpErr("");
        const y25 = await getCountryYearPredictions({ year: 2025 });
        const y30 = await getCountryYearPredictions({ year: 2030 });

        const map25 = new Map(y25.map(r => [r.country, Number(r.ghi_pred)]));
        const rows = y30
          .map(r => {
            const v25 = map25.get(r.country);
            const v30 = Number(r.ghi_pred);
            if (v25 == null || Number.isNaN(v25)) return null;
            const improvement = v25 - v30; // positive = better (decline)
            return { country: r.country, improvement, v25, v30 };
          })
          .filter(Boolean)
          .sort((a, b) => b.improvement - a.improvement)
          .slice(0, 10);

        setImprovers(rows);
      } catch (e) { setImpErr(e?.response?.data?.detail || e.message); }
    })();
  }, []);

  // SEVERITY DISTRIBUTION (for distYear)
  useEffect(() => {
    (async () => {
      try {
        setDistErr("");
        const rows = await getCountryYearPredictions({ year: distYear });
        const bins = [
          { key: "Low <10",           from: 0,   to: 9.999 },
          { key: "Moderate 10–19.9",  from: 10,  to: 19.999 },
          { key: "Serious 20–29.9",   from: 20,  to: 29.999 },
          { key: "Alarming 30–49.9",  from: 30,  to: 49.999 },
          { key: "Extremely ≥50",     from: 50,  to: 1000 },
        ];
        const counts = bins.map(b => ({ name: b.key, value: 0 }));
        rows.forEach(r => {
          const v = Number(r.ghi_pred);
          const binIdx = bins.findIndex(b => v >= b.from && v <= b.to);
          if (binIdx >= 0) counts[binIdx].value += 1;
        });
        setDistData(counts);
      } catch (e) { setDistErr(e?.response?.data?.detail || e.message); }
    })();
  }, [distYear]);

  // Header pills (avg/first/last)
  const { avg, first, last, deltaLabel, trendClass } = useMemo(() => {
    if (!globalData.length) return {};
    const f = globalData[0].global_ghi_mean;
    const l = globalData[globalData.length - 1].global_ghi_mean;
    const d = l - f;
    const p = f !== 0 ? (d / f) * 100 : 0;
    return {
      avg: fmt1(globalData.reduce((s, r) => s + (r.global_ghi_mean ?? 0), 0) / globalData.length),
      first: fmt1(f),
      last: fmt1(l),
      deltaLabel: `${d < 0 ? "↓" : d > 0 ? "↑" : "→"} ${fmt1(Math.abs(d))} pts (${d < 0 ? "-" : d > 0 ? "+" : ""}${fmt1(Math.abs(p))}%)`,
      trendClass: d < 0 ? "down" : d > 0 ? "up" : "",
    };
  }, [globalData]);

  // Compact, intuitive trend (for one single caption)
  const compactTrend = useMemo(() => {
    if (globalData.length < 2) return null;
    const startY = globalData[0].year;
    const endY   = globalData[globalData.length - 1].year;
    const start  = globalData[0].global_ghi_mean;
    const end    = globalData[globalData.length - 1].global_ghi_mean;
    const yrs    = Math.max(1, endY - startY);
    const delta  = end - start;
    return {
      startY, endY, yrs,
      startVal: fmt1(start),
      endVal:   fmt1(end),
      deltaPts: fmt1(Math.abs(delta)),
      perYear:  fmt1(Math.abs(delta) / yrs),
      pct:      fmt1(start ? (Math.abs(delta) / start) * 100 : 0),
      arrow:    delta > 0 ? "↑" : delta < 0 ? "↓" : "→",
      word:     delta > 0 ? "higher" : delta < 0 ? "lower" : "flat",
    };
  }, [globalData]);

  const severityColors = ["#86efac", "#fde68a", "#fca5a5", "#ef4444", "#7f1d1d"]; // green→red

  return (
    <main className="content">
      {/* HERO (bg image lives in CSS) */}
      <section className="hero">
        <div className="hero-inner">
          <h1>Grain of Hope</h1>
          <p>Predictive insights to help the world fight hunger — country by country.</p>
          <div className="ctas">
            <a className="btn" href="#/calculator">Open Calculator</a>
            <a className="btn ghost" href="#/chatbot">Ask the Chatbot</a>
            <a className="btn ghost" href="#insights">View Insights ↓</a>
          </div>
        </div>
      </section>

      {/* INSIGHTS */}
      <section id="insights" className="section">
        {/* Full-width row: global line + caption */}
        <div className="panel">
          <div className="panel-header">
            <h3>Global Trend (2025–2030)</h3>
            {avg && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="pill">avg {avg}</span>
                <span className={`pill trend ${trendClass}`}>{deltaLabel}</span>
                <span className="pill">2025: {first}</span>
                <span className="pill">2030: {last}</span>
              </div>
            )}
          </div>
          {gErr && <p className="error">Error: {gErr}</p>}
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={globalData} margin={{ left: 16, right: 16, top: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" label={{ value: "Year", position: "insideBottomRight", offset: -10 }} />
                <YAxis
                  domain={domainPrefer15to18}
                  allowDecimals
                  tickFormatter={yTickFmt}
                  label={{ value: "GHI (15–18)", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="global_ghi_mean"
                  name="Years"
                  stroke="#16a34a"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                >
                  <LabelList dataKey="global_ghi_mean" formatter={(v) => fmt1(v)} position="top" />
                </Line>
              </LineChart>
            </ResponsiveContainer>

            {/* SINGLE concise caption */}
            {compactTrend && (
              <p className="chart-caption">
                <strong>Summary:</strong> {compactTrend.arrow} {compactTrend.deltaPts} pts ({compactTrend.pct}%)
                from {compactTrend.startVal} → {compactTrend.endVal} by {compactTrend.endY} —
                about {compactTrend.perYear} pts/yr.{" "}
                <br />
                <strong>Higher GHI means higher hunger risk;</strong> lower is better.{" "}
                <strong>GHI</strong> is a 0–100 composite index built from four indicators:
                undernourishment, child wasting, child stunting, and under-5 mortality.
              </p>
            )}
          </div>
        </div>

        {/* Top-12 countries */}
        <div className="panel">
          <div className="panel-header">
            <h3>Top 12 Countries — {year}</h3>
            <div className="controls">
              <label htmlFor="year">Year:</label>
              <select id="year" value={year} onChange={e => setYear(Number(e.target.value))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {cErr && <p className="error">Error: {cErr}</p>}
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={countryData} margin={{ left: 20, right: 16, top: 30, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" interval={0} angle={-30} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} label={{ value: "GHI (0–100)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="ghi_pred" name="Countries" fill="#111">
                  <LabelList dataKey="ghi_pred" position="top" formatter={(v) => fmt1(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 50/50 grid row: new insights */}
        <div className="insights-grid">
          {/* Biggest improvers */}
          <div className="panel">
            <div className="panel-header">
              <h3>Biggest Improvers (2025 → 2030)</h3>
              <span className="pill">Δ = 2025 − 2030 (pts)</span>
            </div>
            {impErr && <p className="error">Error: {impErr}</p>}
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={[...improvers].reverse()}
                  layout="vertical"
                  margin={{ left: 80, right: 16, top: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: "Improvement (points)", position: "insideBottomRight", offset: -10 }} />
                  <YAxis type="category" dataKey="country" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="improvement" name="Improvement" fill="#16a34a">
                    <LabelList dataKey="improvement" position="right" formatter={(v) => fmt1(v)} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Severity distribution */}
          <div className="panel">
            <div className="panel-header">
              <h3>Severity Distribution — {distYear}</h3>
              <div className="controls">
                <label htmlFor="distYear">Year:</label>
                <select id="distYear" value={distYear} onChange={e => setDistYear(Number(e.target.value))}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {distErr && <p className="error">Error: {distErr}</p>}
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={distData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={80}
                    outerRadius={140}
                    paddingAngle={2}
                  >
                    {distData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={severityColors[i % severityColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
