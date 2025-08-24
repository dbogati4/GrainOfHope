// src/pages/News.jsx
import { useEffect, useState } from "react";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("malnutrition"); // ⬅️ default now "malnutrition"

  // Use env var (Vite). For CRA use: process.env.REACT_APP_NEWS_API_KEY
  const API_KEY = import.meta.env.VITE_NEWS_API_KEY;

  if (!API_KEY) {
    console.error("Missing VITE_NEWS_API_KEY. Add it to your .env and restart.");
  }

  // ---- THEME WHITELIST & NOISE FILTERS ----
  const BASE_TOPICS = [
    "hunger",
    '"food insecurity"',
    "famine",
    "malnutrition",
    "undernutrition",
    '"food crisis"',
    '"food shortage"',
    '"food prices"',
    '"food aid"',
    '"food assistance"',
    '"school meals"',
    '"food bank"',
    "nutrition"
  ];

  const NEGATIVE_TOPICS = [
    "sports",
    "football",
    "soccer",
    "basketball",
    "baseball",
    "tennis",
    "cricket",
    "music",
    "celebrity",
    "entertainment",
    "gaming",
    "movie",
    "tv"
  ];

  // Optional: restrict to higher-signal publishers (enabled by default)
  // ✅ Removed BBC (bbc.com & bbc.co.uk)
  const USE_DOMAIN_WHITELIST = true;
  const DOMAIN_WHITELIST = [
    "wfp.org",
    "fao.org",
    "reliefweb.int",
    "who.int",
    "unicef.org",
    "worldbank.org",
    "reuters.com",
    "apnews.com",
    "guardian.com",
    "aljazeera.com",
    "nytimes.com",
    "washingtonpost.com"
  ];

  function buildQuery(userTerm, cat) {
    const base = `(${BASE_TOPICS.join(" OR ")})`;
    const user = userTerm ? `(${userTerm})` : `(${cat})`;
    const nots = NEGATIVE_TOPICS.map((t) => `NOT ${t}`).join(" ");
    return `(${base} AND ${user}) ${nots}`.trim();
  }

  // ---- Strip HTML tags so <a>, <p>, etc. never render ----
  function stripHtml(s) {
    return s ? s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : "";
  }

  const fetchNews = async () => {
    setLoading(true);
    try {
      const query = buildQuery(search, category);

      const params = new URLSearchParams({
        q: query,
        language: "en",
        sortBy: "publishedAt",
        pageSize: "12",
        searchIn: "title,description",
        apiKey: API_KEY
      });

      if (search && search.trim().length > 0) {
        params.set("qInTitle", search.trim());
      }

      if (USE_DOMAIN_WHITELIST) {
        params.set("domains", DOMAIN_WHITELIST.join(","));
      }

      const url = `https://newsapi.org/v2/everything?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "ok") {
        console.error("NewsAPI error:", data);
        setArticles([]);
        setLoading(false);
        return;
      }

      const cleaned = (data.articles || []).map((a) => ({
        ...a,
        title: stripHtml(a.title),
        description: stripHtml(a.description) || stripHtml(a.content)
      }));

      setArticles(cleaned);
    } catch (err) {
      console.error("Error fetching news:", err);
      setArticles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNews();
  };

  // ---- Inline styles ----
  const styles = {
    container: {
      width: "min(1100px, calc(100% - 48px))",
      margin: "0 auto",
    },
    hero: {
      position: "relative",
      minHeight: "42vh",
      display: "grid",
      alignItems: "end",
      padding: "24px 0 40px",
      color: "#14532d",
      background: "#f0fdf4",
      borderRadius: 12,
    },
    heroInner: {
      textAlign: "center",
    },
    heroH1: {
      margin: "0 0 10px",
      fontWeight: 900,
      fontSize: "clamp(34px, 5.2vw, 60px)",
    },
    heroP: {
      margin: 0,
      fontSize: "clamp(16px, 2vw, 20px)",
      opacity: 0.98,
    },
    section: {
      padding: "32px 0 64px",
    },
    formRow: {
      display: "flex",
      gap: 12,
      marginBottom: 20,
    },
    input: {
      flex: 1,
      padding: 12,
      border: "1px solid #e5e7eb",
      borderRadius: 8,
      outline: "none",
    },
    primaryBtn: {
      backgroundColor: "#22c55e",
      color: "#fff",
      border: "none",
      padding: "12px 18px",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
    },
    chipRow: {
      display: "flex",
      gap: 10,
      marginBottom: 22,
      flexWrap: "wrap",
    },
    chip: (active) => ({
      padding: "8px 14px",
      borderRadius: 8,
      border: "1px solid #e5e7eb",
      backgroundColor: active ? "#22c55e" : "#fff",
      color: active ? "#fff" : "#111",
      cursor: "pointer",
      fontWeight: 600,
    }),
    card: {
      background: "#fff",
      color: "#111",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      padding: "18px 18px 10px",
      boxShadow: "0 10px 22px rgba(0,0,0,.08)",
      marginBottom: 22,
      lineHeight: 1.65,
      fontSize: 16,
    },
    kicker: {
      textTransform: "uppercase",
      letterSpacing: ".12em",
      fontWeight: 700,
      fontSize: 12,
      color: "#6b7280",
      margin: "0 0 6px",
    },
    title: { margin: "0 0 8px", fontSize: 26 },
    deck: { margin: 0, color: "#374151" },
    divider: {
      height: 1,
      background: "linear-gradient(90deg, transparent, #e5e7eb, transparent)",
      margin: "14px 0",
    },
    newsImg: {
      width: "100%",
      borderRadius: 12,
      marginBottom: 12,
      objectFit: "cover",
      maxHeight: 260,
    },
    ctaBox: {
      marginTop: 10,
      background: "#f0fdf4",
      color: "#14532d",
      border: "1px solid #bbefcf",
      borderRadius: 12,
      padding: 12,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
    },
    linkBtn: {
      backgroundColor: "#22c55e",
      color: "#fff",
      border: "none",
      padding: "10px 14px",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 700,
      textDecoration: "none",
      display: "inline-block",
    },
  };

  return (
    <div style={styles.container}>
      {/* Hero */}
      <header style={styles.hero}>
        <div style={styles.heroInner}>
          <h1 style={styles.heroH1}>World Hunger News</h1>
          <p style={styles.heroP}>
            Stay updated on hunger, famine, and food security worldwide.
          </p>
        </div>
      </header>

      <section style={styles.section}>
        {/* Search bar */}
        <form onSubmit={handleSearch} style={styles.formRow}>
          <input
            type="text"
            placeholder="Search for food news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.primaryBtn}>
            Search
          </button>
        </form>

        {/* Category filter — ordered as requested */}
        <div style={styles.chipRow}>
          {["malnutrition", "famine", "food security", "hunger"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={styles.chip(category === cat)}
              type="button"
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* News articles */}
        {loading ? (
          <p>Loading latest food news...</p>
        ) : articles.length === 0 ? (
          <p>No news articles found. Please try again later.</p>
        ) : (
          articles.map((article, index) => (
            <article key={index} style={styles.card}>
              <header>
                <p style={styles.kicker}>
                  {new Date(article.publishedAt).toDateString()}
                </p>
                <h2 style={styles.title}>{article.title}</h2>
                <p style={styles.deck}>{article.source?.name}</p>
              </header>

              <div style={styles.divider} />

              {article.urlToImage && (
                <img
                  src={article.urlToImage}
                  alt={article.title || "news"}
                  style={styles.newsImg}
                />
              )}

              <p>{article.description || "Read more on the official site."}</p>

              <footer style={styles.ctaBox}>
                <span>Click to read the full story.</span>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkBtn}
                >
                  Read Full Article
                </a>
              </footer>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
