// src/pages/KnowledgeQuiz.jsx
import { useEffect, useMemo, useState } from "react";

export default function KnowledgeQuiz() {
  // --- Base content (rephrased) ---
  const BASE_QUESTIONS = useMemo(
    () => [
      {
        id: "q_hunger_count",
        prompt: "Roughly how many people are currently affected by hunger?",
        options: ["350 million people", "735 million people", "1.2 billion people", "2.4 billion people"],
        answer: "735 million people",
        explanation:
          "Recent UN estimates indicate about 735 million people face hunger. About 2.4 billion experience moderate to severe food insecurity."
      },
      {
        id: "q_food_waste",
        prompt: "What share of global food output is lost or wasted each year?",
        options: ["10–15%", "20–25%", "30–40%", "45–50%"],
        answer: "30–40%",
        explanation:
          "Roughly one-third of all food produced (around 30–40%) is lost or wasted along the supply chain."
      },
      {
        id: "q_region",
        prompt: "Which region has the highest rate of undernourishment?",
        options: ["South Asia", "Latin America", "Sub-Saharan Africa", "Southeast Asia"],
        answer: "Sub-Saharan Africa",
        explanation:
          "Sub-Saharan Africa has the highest prevalence of undernourishment compared with other regions."
      },
      {
        id: "q_cause",
        prompt: "What most strongly drives chronic hunger worldwide?",
        options: ["Natural disasters", "Lack of food production", "Poverty and inequality", "Climate change"],
        answer: "Poverty and inequality",
        explanation:
          "The world produces enough food. Access is limited by poverty, inequality, conflict, and weak systems."
      },
      {
        id: "q_cost",
        prompt: "What is the approximate annual cost to end hunger by 2030?",
        options: ["$7 billion", "$40 billion", "$100 billion", "$267 billion"],
        answer: "$267 billion",
        explanation:
          "UN analyses estimate about $267 billion per year would be needed globally until 2030—less than 1% of world GDP."
      },
      {
        id: "q_rural",
        prompt: "What percentage of the world's hungry people live in rural areas?",
        options: ["50%", "65%", "80%", "95%"],
        answer: "80%",
        explanation:
          "Roughly 80% of people facing hunger live in rural regions, often depending on agriculture for livelihoods."
      }
    ],
    []
  );

  // --- Helpers ---
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const prepareRun = () =>
    shuffle(BASE_QUESTIONS).map((q) => {
      const shuffled = shuffle(q.options);
      const correctIndex = shuffled.findIndex((opt) => opt === q.answer);
      return {
        id: q.id,
        prompt: q.prompt,
        options: shuffled,
        correctIndex,
        explanation: q.explanation,
      };
    });

  // --- State ---
  const [questions, setQuestions] = useState(() => prepareRun());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const current = questions[index];
  const progress = Math.round((index / total) * 100);
  const scoreLabel = `${score}/${total}`;

  // --- Actions ---
  const submitAnswer = () => {
    if (selected == null || submitted) return;
    if (selected === current.correctIndex) setScore((s) => s + 1);
    setSubmitted(true);
  };

  const next = () => {
    if (!submitted) return;
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setFinished(true);
    }
  };

  const retake = () => {
    setQuestions(prepareRun());
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setScore(0);
    setFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Styles (match site, remove option bold & soften question weight) ---
  const styles = {
    container: { width: "min(900px, calc(100% - 48px))", margin: "0 auto", textTransform: "none" },
    hero: { textAlign: "center", padding: "28px 0 12px" },
    title: {
      fontWeight: 900,
      fontSize: "clamp(28px,4.6vw,42px)",
      margin: 0,
      textTransform: "none",
      letterSpacing: "normal",
    },
    subtitle: { opacity: 0.9, marginTop: 6, textTransform: "none", letterSpacing: "normal" },

    barWrap: {
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      padding: 12,
      margin: "10px 0 20px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      justifyContent: "space-between",
      textTransform: "none",
    },
    bar: { height: 8, background: "#e5e7eb", borderRadius: 8, flex: 1, overflow: "hidden" },
    barInner: (w) => ({ height: "100%", width: `${w}%`, background: "#22c55e" }),
    label: { fontSize: 14, color: "#6b7280", textTransform: "none", letterSpacing: "normal" },

    card: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: 22,
      boxShadow: "0 10px 22px rgba(0,0,0,.08)",
      margin: "0 0 18px",
      textTransform: "none",
    },
    qTitle: {
      margin: "0 0 18px",
      fontSize: 26,
      fontWeight: 600, // was 800 – softer for cleaner look
      textTransform: "none",
      letterSpacing: "normal",
      lineHeight: 1.35,
      color: "#111827",
    },

    optBtn: (state) => ({
      width: "100%",
      textAlign: "left",
      padding: "14px 16px",
      borderRadius: 12,
      border: `2px solid ${state.border}`,
      background: state.bg,
      color: state.color,
      cursor: state.cursor || "pointer",
      marginBottom: 12,
      fontSize: 16,
      fontWeight: 400, // normal weight (no bold) for options
      outline: "none",
      transition: "all .15s ease",
      textTransform: "none",
      letterSpacing: "normal",
      lineHeight: 1.5,
      wordBreak: "break-word",
    }),

    footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
    submitBtn: (enabled) => ({
      backgroundColor: enabled ? "#9ca3af" : "#e5e7eb",
      color: enabled ? "#fff" : "#9ca3af",
      border: "none",
      padding: "12px 18px",
      borderRadius: 10,
      cursor: enabled ? "pointer" : "not-allowed",
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "normal",
    }),
    nextBtn: {
      backgroundColor: "#22c55e",
      color: "#fff",
      border: "none",
      padding: "12px 18px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "normal",
    },

    explBox: {
      marginTop: 14,
      borderLeft: "4px solid #3b82f6",
      background: "#eff6ff",
      padding: "12px 12px",
      borderRadius: 10,
      color: "#1e3a8a",
      textTransform: "none",
      letterSpacing: "normal",
    },

    // Results
    resultCard: {
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: 28,
      boxShadow: "0 10px 22px rgba(0,0,0,.08)",
      textAlign: "center",
      textTransform: "none",
    },
    bigScore: { fontSize: 52, fontWeight: 900, margin: "8px 0 0", textTransform: "none" },
    verdict: (color) => ({ margin: "6px 0 16px", color, textTransform: "none" }),
    takeaways: {
      textAlign: "left",
      border: "1px solid #e5e7eb",
      background: "#f9fafb",
      borderRadius: 12,
      padding: "14px 16px",
      marginTop: 16,
      textTransform: "none",
    },
    retakeBtn: {
      marginTop: 18,
      backgroundColor: "#16a34a",
      color: "#fff",
      border: "none",
      padding: "12px 18px",
      borderRadius: 10,
      cursor: "pointer",
      fontWeight: 800,
      textTransform: "none",
      letterSpacing: "normal",
    },
  };

  // --- Render ---
  if (finished) {
    let verdictText = "Keep learning! Understanding hunger is the first step to fighting it.";
    let verdictColor = "#b91c1c";
    if (score >= 5) {
      verdictText = "Excellent! You’re well-informed about hunger facts.";
      verdictColor = "#166534";
    } else if (score >= 3) {
      verdictText = "Not bad—there’s room to grow your knowledge.";
      verdictColor = "#b45309";
    }

    return (
      <main style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.title}>Hunger Knowledge Quiz</h1>
          <p style={styles.subtitle}>Nice work! Here’s how you did.</p>
        </div>

        <section style={styles.resultCard}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div style={styles.bigScore}>{score}/{total}</div>
          <div style={styles.verdict(verdictColor)}>{verdictText}</div>

          <div style={styles.takeaways}>
            <strong>Key Takeaways:</strong>
            <ul style={{ margin: "8px 0 0 18px", lineHeight: 1.8 }}>
              <li>~735M people face hunger despite sufficient global production.</li>
              <li>About one-third of food is lost or wasted along the chain.</li>
              <li>Ending hunger by 2030 is feasible (~$267B/yr, &lt;1% global GDP).</li>
            </ul>
          </div>

          <button type="button" style={styles.retakeBtn} onClick={retake}>
            Retake Quiz
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      {/* Hero */}
      <div style={styles.hero}>
        <h1 style={styles.title}>Hunger Knowledge Quiz</h1>
        <p style={styles.subtitle}>Test your knowledge about hunger—and learn key facts along the way.</p>
      </div>

      {/* Progress */}
      <div style={styles.barWrap}>
        <div style={styles.label}>Question {index + 1} of {total}</div>
        <div style={styles.bar}><div style={styles.barInner(progress)} /></div>
        <div style={styles.label}>Score: {scoreLabel}</div>
      </div>

      {/* Question card */}
      <section style={styles.card}>
        <h2 style={styles.qTitle}>{current.prompt}</h2>

        {current.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === current.correctIndex;
          let state = { border: "#e5e7eb", bg: "#fff", color: "#111827" };

          if (!submitted && isSelected) {
            state = { border: "#93c5fd", bg: "#eff6ff", color: "#1e3a8a" };
          }
          if (submitted) {
            if (isCorrect) state = { border: "#22c55e", bg: "#ecfdf5", color: "#065f46", cursor: "default" };
            else if (isSelected) state = { border: "#ef4444", bg: "#fee2e2", color: "#7f1d1d", cursor: "default" };
            else state = { border: "#e5e7eb", bg: "#fff", color: "#6b7280", cursor: "default" };
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => !submitted && setSelected(i)}
              style={styles.optBtn(state)}
              disabled={submitted}
            >
              {opt}
              {submitted && isCorrect ? "  ✓" : ""}
              {submitted && !isCorrect && isSelected ? "  ✕" : ""}
            </button>
          );
        })}

        {/* Explanation */}
        {submitted && (
          <div style={styles.explBox}>
            <strong>Explanation:</strong>
            <div style={{ marginTop: 6 }}>{current.explanation}</div>
          </div>
        )}

        {/* Footer actions */}
        <div style={styles.footerRow}>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            {submitted ? "Ready for next question" : "Select an answer"}
          </div>

          {!submitted ? (
            <button
              type="button"
              style={styles.submitBtn(selected != null)}
              onClick={submitAnswer}
              disabled={selected == null}
            >
              Submit Answer
            </button>
          ) : (
            <button type="button" style={styles.nextBtn} onClick={next}>
              {index + 1 < total ? "Next Question" : "Finish Quiz"}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
