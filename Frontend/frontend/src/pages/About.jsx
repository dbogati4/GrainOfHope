// src/pages/About.jsx
export default function About() {
  // --- Shared visual language with MythBusting.jsx ---
  const styles = {
    container: { width: "min(1100px, calc(100% - 48px))", margin: "0 auto" },
    hero: {
      position: "relative",
      minHeight: "34vh",
      display: "grid",
      alignItems: "end",
      padding: "24px 0 36px",
      color: "#14532d",
      background: "#fff7ed", // warm tint to match site palette
      borderRadius: 12,
    },
    heroInner: { textAlign: "center" },
    heroH1: { margin: "0 0 10px", fontWeight: 900, fontSize: "clamp(34px,5.2vw,60px)" },
    heroP: { margin: 0, fontSize: "clamp(16px,2vw,20px)", opacity: 0.98 },

    section: { padding: "32px 0 64px" },
    kicker: {
      textTransform: "uppercase",
      letterSpacing: ".12em",
      fontWeight: 800,
      fontSize: 12,
      color: "#6b7280",
      margin: "0 0 12px",
    },

    // Cards + grid
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
    ul: { margin: 0, paddingLeft: 18, lineHeight: 1.8 },
    metric: { color: "#065f46", fontWeight: 800 }, // emphasized numbers

    // Callout (blue info box)
    callout: {
      borderLeft: "4px solid #3b82f6",
      background: "#eff6ff",
      padding: "12px 12px",
      borderRadius: 10,
      color: "#1e3a8a",
      marginTop: 12,
    },

    // Divider line
    divider: {
      height: 1,
      background: "linear-gradient(90deg, transparent, #e5e7eb, transparent)",
      margin: "18px 0",
    },

    // Gradient takeaways + CTA
    takeaways: {
      marginTop: 28,
      padding: 22,
      borderRadius: 18,
      color: "#fff",
      background: "linear-gradient(135deg,#6d28d9,#7c3aed,#4f46e5)",
      border: "1px solid rgba(255,255,255,.18)",
      boxShadow: "0 16px 32px rgba(99,102,241,.25)",
    },
    takeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16, marginTop: 8 },
    takeH3: { margin: "0 0 8px", fontSize: 20, fontWeight: 900 },
    ctaRow: { marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" },
    ctaBtn: {
      backgroundColor: "#ffffff",
      color: "#1f2937",
      border: "none",
      padding: "12px 18px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 800,
      boxShadow: "0 6px 18px rgba(0,0,0,.12)",
      textDecoration: "none",
      display: "inline-block",
    },
  };

  return (
    <main>
      <div style={styles.container}>
        {/* Hero */}
        <header style={styles.hero}>
          <div style={styles.heroInner}>
            <h1 style={styles.heroH1}>About Grain of Hope</h1>
            <p style={styles.heroP}>
              A concise, data-forward look at the global hunger landscape—built to inspire action.
            </p>
          </div>
        </header>

        {/* Content */}
        <section style={styles.section}>
          <p style={styles.kicker}>Research Brief</p>

          <div style={styles.grid}>
            {/* Card 1 */}
            <article style={styles.card}>
              <h3 style={styles.h3}>1) Scope of the Crisis</h3>
              <ul style={styles.ul}>
                <li>
                  ~<span style={styles.metric}>9 million</span> people die yearly from hunger-related causes
                  (≈ <span style={styles.metric}>24,600/day</span>).
                </li>
                <li>
                  About <span style={styles.metric}>733 million</span> people face hunger daily (~1 in 11 globally).
                </li>
                <li>
                  <span style={styles.metric}>2.8 billion</span> people—~<span style={styles.metric}>35%</span>—cannot afford a healthy diet.
                </li>
              </ul>
              <div style={styles.callout}>
                <strong>Takeaway:</strong> The core problem is access and affordability—not global food scarcity.
              </div>
            </article>

            {/* Card 2 */}
            <article style={styles.card}>
              <h3 style={styles.h3}>2) Children & Malnutrition</h3>
              <ul style={styles.ul}>
                <li>Over <span style={styles.metric}>3 million</span> children die each year from hunger-related causes.</li>
                <li>Malnutrition contributes to ~<span style={styles.metric}>1 million</span> child deaths annually.</li>
                <li>
                  Undernutrition factors into ~<span style={styles.metric}>54%</span> of child mortality and
                  <span style={styles.metric}> 35%</span> of deaths under five.
                </li>
              </ul>
            </article>

            {/* Card 3 */}
            <article style={styles.card}>
              <h3 style={styles.h3}>3) Famine & Extreme Conditions</h3>
              <ul style={styles.ul}>
                <li>
                  Famine threshold: &gt; <span style={styles.metric}>2 deaths / 10,000 people / day</span> from starvation or related disease.
                </li>
                <li>
                  Multiple regions (e.g., Gaza, Sudan, Haiti, Mali) face escalating crises; nearly
                  <span style={styles.metric}> 300 million</span> people are at severe risk due to conflict, climate shocks, and aid shortfalls.
                </li>
              </ul>
            </article>

            {/* Card 4 */}
            <article style={styles.card}>
              <h3 style={styles.h3}>4) Regions & Key Drivers</h3>
              <ul style={styles.ul}>
                <li>
                  Highest hunger rates persist in <strong>Sub-Saharan Africa</strong> and <strong>South Asia</strong>.
                </li>
                <li>
                  Major drivers: <em>conflict, poverty, climate change, inequality</em>;
                  ~<span style={styles.metric}>85%</span> of crisis-level hunger occurs in conflict-affected areas.
                </li>
                <li>Systems and prices—not global production—keep food out of reach.</li>
              </ul>
            </article>

            {/* Card 5 */}
            <article style={styles.card}>
              <h3 style={styles.h3}>5) Global Goals & Headwinds</h3>
              <ul style={styles.ul}>
                <li><strong>SDG 2 (Zero Hunger)</strong> targets 2030—current trends indicate we’re off-track.</li>
                <li>Progress is uneven: some countries advance while many have stalled.</li>
              </ul>
            </article>
          </div>

          <div style={styles.divider} />

          {/* Gradient Takeaways + single CTA */}
          <div style={styles.takeaways}>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: 28, textAlign: "center" }}>
              Key Takeaways
            </h2>

            <div style={styles.takeGrid}>
              <div>
                <h3 style={styles.takeH3}>Why Hunger Persists</h3>
                <ul style={{ ...styles.ul, color: "rgba(255,255,255,.95)" }}>
                  <li>Access, affordability, and conflict outweigh global production limits.</li>
                  <li>High food prices and weak infrastructure block nutritious diets.</li>
                  <li>Children suffer lifelong impacts from early malnutrition.</li>
                </ul>
              </div>
              <div>
                <h3 style={styles.takeH3}>What Moves the Needle</h3>
                <ul style={{ ...styles.ul, color: "rgba(255,255,255,.95)" }}>
                  <li>Social protection, fair markets, and resilient food systems.</li>
                  <li>Conflict prevention and climate-smart agriculture.</li>
                  <li>Targeted nutrition, especially for mothers and children.</li>
                </ul>
              </div>
            </div>

            {/* Single CTA (Contact Us removed) */}
            <div style={styles.ctaRow}>
              <a href="#/calculator" style={styles.ctaBtn}>
                Explore Predictions
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
