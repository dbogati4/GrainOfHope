// src/pages/mythbusting.jsx
import { useMemo } from "react";

export default function MythBusting() {
  const goQuiz = () => {
    window.location.hash = "#/knowledge-quiz";
  };

  // Rephrased items (not copied from screenshots)
  const items = useMemo(
    () => [
      {
        id: 1,
        myth: "“The world doesn’t grow enough food for everyone.”",
        fact:
          "Farms already produce enough calories to feed ~10B people. Gaps come from access, distribution, and waste.",
        expl:
          "Poverty, weak infrastructure, conflict, and supply-chain losses keep food from people—not global production limits."
      },
      {
        id: 2,
        myth: "“Hunger only happens in poorer countries.”",
        fact:
          "Food insecurity exists in wealthy nations too. In the U.S., about 1 in 8 people struggles to consistently access nutritious food.",
        expl:
          "Low wages, high costs, and limited grocery access create hunger in both cities and rural areas."
      },
      {
        id: 3,
        myth: "“You can spot hunger just by looking.”",
        fact:
          "Micronutrient deficiencies (‘hidden hunger’) affect billions who may appear healthy or average weight.",
        expl:
          "Lack of iron, iodine, vitamin A, and others harms learning and immunity without obvious outward signs."
      },
      {
        id: 4,
        myth: "“Food aid creates dependency and hurts local farmers.”",
        fact:
          "Well-designed programs buy locally or use cash/vouchers, strengthening markets and smallholders.",
        expl:
          "Local procurement and cash transfers inject demand into communities and build resilience during shocks."
      },
      {
        id: 5,
        myth: "“Overpopulation is the main cause of hunger.”",
        fact:
          "Governance, inequality, and conflict explain hunger better than population size. Some dense countries keep rates low.",
        expl:
          "Sound policy, social protection, and fair markets secure food access even as populations grow."
      },
      {
        id: 6,
        myth: "“Natural disasters are the primary driver of hunger.”",
        fact:
          "Chronic hunger is driven mostly by poverty and conflict. Disasters exacerbate existing vulnerabilities.",
        expl:
          "Diversified livelihoods, insurance, and safety nets reduce disaster impacts on food security."
      },
      {
        id: 7,
        myth: "“GMOs are the single key to ending hunger.”",
        fact:
          "Technology helps, but access and affordability are central. Distribution and income matter as much as yields.",
        expl:
          "Infrastructure, fair prices, and stable jobs determine who can obtain nutritious food."
      },
      {
        id: 8,
        myth: "“Household food waste is tiny and irrelevant.”",
        fact:
          "In high-income countries, consumers generate the majority of food waste—around 60%.",
        expl:
          "Meal planning, proper storage, and using ‘imperfect’ produce cut waste and emissions."
      }
    ],
    []
  );

  // ---- Styles aligned with your site ----
  const styles = {
    container: { width: "min(1100px, calc(100% - 48px))", margin: "0 auto" },
    hero: {
      position: "relative",
      minHeight: "34vh",
      display: "grid",
      alignItems: "end",
      padding: "24px 0 36px",
      color: "#14532d",
      background: "#fff7ed",
      borderRadius: 12,
    },
    heroInner: { textAlign: "center" },
    heroH1: { margin: "0 0 10px", fontWeight: 900, fontSize: "clamp(34px,5.2vw,60px)" },
    heroP: { margin: 0, fontSize: "clamp(16px,2vw,20px)", opacity: 0.98 },
    section: { padding: "32px 0 64px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 },
    card: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: 18,
      boxShadow: "0 10px 22px rgba(0,0,0,.08)",
      lineHeight: 1.65,
      fontSize: 16,
    },
    h3: { margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#111827" },
    row: { marginBottom: 12 },
    badgeRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
    mythBadge: {
      display: "inline-block", padding: "6px 10px", borderRadius: 999,
      background: "#fee2e2", color: "#b91c1c", fontWeight: 800, fontSize: 12,
      textTransform: "uppercase", letterSpacing: ".06em",
    },
    factBadge: {
      display: "inline-block", padding: "6px 10px", borderRadius: 999,
      background: "#dcfce7", color: "#166534", fontWeight: 800, fontSize: 12,
      textTransform: "uppercase", letterSpacing: ".06em",
    },
    infoBadge: {
      display: "inline-block", padding: "6px 10px", borderRadius: 999,
      background: "#e0e7ff", color: "#1e40af", fontWeight: 800, fontSize: 12,
      textTransform: "uppercase", letterSpacing: ".06em",
    },
    mythBox: { borderLeft: "4px solid #ef4444", background: "#fef2f2", padding: "10px 12px", borderRadius: 10, color: "#7f1d1d", fontWeight: 600 },
    factBox: { borderLeft: "4px solid #22c55e", background: "#ecfdf5", padding: "12px 12px", borderRadius: 10, color: "#065f46", fontWeight: 700 },
    explBox: { borderLeft: "4px solid #3b82f6", background: "#eff6ff", padding: "12px 12px", borderRadius: 10, color: "#1e3a8a" },
    takeaways: {
      marginTop: 28, padding: 22, borderRadius: 18, color: "#fff",
      background: "linear-gradient(135deg,#6d28d9,#7c3aed,#4f46e5)",
      border: "1px solid rgba(255,255,255,.18)", boxShadow: "0 16px 32px rgba(99,102,241,.25)",
    },
    takeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 8 },
    takeH3: { margin: "0 0 8px", fontSize: 20, fontWeight: 900 },
    ul: { margin: 0, paddingLeft: 18, lineHeight: 1.8 },
    ctaRow: { marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" },
    ctaBtn: {
      backgroundColor: "#ffffff", color: "#1f2937", border: "none",
      padding: "12px 18px", borderRadius: 10, cursor: "pointer",
      fontWeight: 800, boxShadow: "0 6px 18px rgba(0,0,0,.12)",
    },
    kicker: { textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 800, fontSize: 12, color: "#6b7280", margin: "0 0 12px" },
  };

  return (
    <div style={styles.container}>
      {/* Hero */}
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <h1 style={styles.heroH1}>Hunger Reality Check</h1>
          <p style={styles.heroP}>
           Cut through myths about hunger, food waste, and production—so we can focus on what works.
          </p>
        </div>
      </header>

      {/* Myth cards */}
      <section style={styles.section}>
        <p style={styles.kicker}>Myths vs. Facts</p>
        <div style={styles.grid}>
          {items.map((item) => (
            <article key={item.id} style={styles.card}>
              <h3 style={styles.h3}>Myth vs. Fact #{item.id}</h3>

              <div style={styles.row}>
                <div style={styles.badgeRow}><span style={styles.mythBadge}>Myth</span></div>
                <div style={styles.mythBox}>{item.myth}</div>
              </div>

              <div style={styles.row}>
                <div style={styles.badgeRow}><span style={styles.factBadge}>Fact</span></div>
                <div style={styles.factBox}>{item.fact}</div>
              </div>

              <div style={styles.row}>
                <div style={styles.badgeRow}><span style={styles.infoBadge}>Explanation</span></div>
                <div style={styles.explBox}>{item.expl}</div>
              </div>
            </article>
          ))}
        </div>

        {/* Key Takeaways + single CTA */}
        <div style={styles.takeaways}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: 28, textAlign: "center" }}>
            Key Takeaways
          </h2>

          <div style={styles.takeGrid}>
            <div>
              <h3 style={styles.takeH3}>The Reality of Hunger</h3>
              <ul style={styles.ul}>
                <li>Access and distribution—not production—drive hunger.</li>
                <li>Poverty, conflict, and weak systems are major causes.</li>
                <li>Hidden hunger harms health without visible signs.</li>
              </ul>
            </div>
            <div>
              <h3 style={styles.takeH3}>What Works</h3>
              <ul style={styles.ul}>
                <li>Local purchases and cash aid support communities.</li>
                <li>Good governance can deliver food security at scale.</li>
                <li>Cutting household waste has real impact.</li>
              </ul>
            </div>
          </div>

          <div style={styles.ctaRow}>
            <button type="button" style={styles.ctaBtn} onClick={goQuiz}>
              Test Your Knowledge
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
