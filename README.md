# GrainOfHope

*A web app to spotlight world hunger, show data-driven forecasts, and motivate effective donations.*

---

## 1. Project overview

GrainOfHope brings together *real* Global Hunger Index (GHI) data and a simple, transparent ML model to help people explore trends and see the *illustrative* impact of donations.

**Key features**

- *Home*: high‑level context and key stats on global hunger.
- *Calculator*: enter a country, year, and donation amount to see estimated *people‑days* covered and an adjustable cost model.
- *Before vs After*: side‑by‑side charts (2025‑2030) that show a baseline global GHI trend *before* and an illustrative, visibility‑scaled trend *after* your donation.
- *Donate*: curated links to trusted organizations.
- *About*: methodology, limitations, and sources.
- *World Hunger News*: real‑time hunger news.
- *Myth Busting*: Myth Vs Reality of Food Hunger.
- *Real Time Quiz*: Quiz to test their knowledge on World Food Hunger. 

**Model at a glance**

- *Type*: Ridge Regression (L2‑regularized linear regression).
- *Library*: `sklearn.linear_model.Ridge`.
- *Features*: one‑hot *country*, centered *year* with polynomial term (*year_c*, *year_c²*), and *country×basis* interactions so each country has its own intercept & slope.
- *Training anchors*: {2000, 2007, 2008, 2014, 2015, 2016, 2022, 2023, 2024}.
- *Predictions*: restricted to *2025–2030* for the public API used by the app.
- *Regularization*: `alpha=10.0` to stabilize fits with limited anchor years and reduce overfitting.
- *Bounds*: predictions clipped to *[0, 100]* (GHI‑style scale).

**Data flow (high level)**

1. Backend loads/normalizes a combined CSV (see *Setup* for path).
2. Model fits on anchor years, then predicts for 2025–2030.
3. API serves:
   - *Country predictions*: `{ country, year, ghi_pred }`
   - *Global mean predictions*: `{ year, global_ghi_mean }`
4. Frontend pages consume these endpoints:
   - *Calculator snapshot* (country + global) and
   - *Before/After* charts (global time series).

> *Note*: “After” charts are *illustrative only*. We convert donations → meal‑days using your cost settings, then apply a tiny visibility‑scaled nudge to the undernourishment component of GHI from the selected year forward. This is just for exploring scenarios, not a causal estimate.

---

## 2. Setup and run instructions

### Backend (FastAPI)

**Prereqs**: *Python 3.10+* recommended.

```bash
# create & activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

# install deps
python -m pip install -r requirements.txt
```

**Data**

- Place your merged CSV at: `data/processed/loaded_full.csv`
- Output predictions are written to `data/processed/` (e.g. `ai_country_year_predictions_2025_2030_from_full.csv` and `ai_global_year_predictions_2025_2030_from_full.csv`).

**Run the API**

```bash
uvicorn main:app --reload
```
- Default dev URL: `http://127.0.0.1:8000/`

### Frontend (Vite + React)

**Prereqs**: *Node 18+* and *npm* (or *yarn/pnpm*).

```bash
# from the frontend folder
npm install
npm run dev
```
- Default dev URL: `http://localhost:5173/`

**API base URL**

- If your API base URL is configurable, check `src/lib/api` and set the backend URL (or add a `.env` like `VITE_API_URL=http://127.0.0.1:8000`).

**Pages to know**

- `Calculator.jsx` contains:
  - *Donation Impact* snapshot (country/year)
  - *Before vs After* charts (global 2025–2030)
  - Donate cards (trusted orgs)

---

## 3. Dependencies and tools used

**Backend**

- *FastAPI* — web framework
- *Uvicorn* — ASGI server
- *pandas* — data wrangling
- *NumPy* — numerical computing
- *Model* — Ridge regression

**Frontend**

- *React* with *Vite*
- *Recharts* — charts (before/after line graphs)
- *Modern CSS* (utility classes & custom styles)

**Data source**

- *Global Hunger Index* — https://www.globalhungerindex.org/

---

## 4. Team members and role

- *Dipika* — Backend model & API; Frontend (Home, Calculator, About).
- *Puskar* — Meeting coordination; Frontend (real‑time hunger news, myth‑busting); Presentation.
- *Sarbocha* — Initial Project Planning.
- *Roshan* — Initial Project planning.

---

*Thank you for supporting efforts to understand and reduce world hunger.*
