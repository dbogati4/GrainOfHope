from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from setup_and_preprocess import load_dataframe
from pathlib import Path
from ai_predict_2025_2035 import main_predict
from typing import List, Optional
import pandas as pd


# === Files produced by your training script ===
COUNTRY_FILE = Path("data/processed/ai_country_year_predictions_2025_2030_from_full.csv")
GLOBAL_FILE  = Path("data/processed/ai_global_year_predictions_2025_2030_from_full.csv")

app = FastAPI(title="Global Hunger Predictions")


# (Optional) allow your frontend to call these APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _require_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise HTTPException(status_code=400, detail=f"Missing file: {path.resolve()}")
    try:
        return pd.read_csv(path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read {path.name}: {e}")

def _split_countries_param(countries: Optional[List[str]]) -> Optional[List[str]]:
    if not countries:
        return None
    # Support both repeated ?country=...&country=... and comma-separated ?country=USA,India
    out: List[str] = []
    for c in countries:
        if c is None:
            continue
        out += [p.strip() for p in c.split(",") if p.strip()]
    # de-duplicate, preserve order
    seen = set()
    uniq = []
    for c in out:
        lc = c.lower()
        if lc not in seen:
            seen.add(lc)
            uniq.append(c)
    return uniq or None


@app.middleware("http")
async def no_cache_headers(request: Request, call_next):
    resp = await call_next(request)
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp



@app.get("/predictions/country-year")
def get_country_year_predictions(
    country: Optional[List[str]] = Query(
        default=None,
        description="Filter by country (repeat param or comma-separated: ?country=India&country=USA or ?country=India,USA)"
    ),
    year: Optional[int] = Query(default=None, description="Exact year filter (e.g., 2029)"),
    start_year: Optional[int] = Query(default=None, description="Inclusive start of year range"),
    end_year: Optional[int] = Query(default=None, description="Inclusive end of year range"),
):
    """
    Returns per-country predictions from ai_country_year_predictions_2025_2030_from_full.csv
    Response items look like: {"country": "India", "year": 2029, "ghi_pred": 27.4}
    """
    df = _require_csv(COUNTRY_FILE)

    # Basic schema checks
    for col in ("country", "year", "ghi_pred"):
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"{COUNTRY_FILE.name} must contain column '{col}'")

    # Filters
    if country:
        wanted = _split_countries_param(country)
        if wanted:
            wanted_lower = {c.lower() for c in wanted}
            df = df[df["country"].astype(str).str.lower().isin(wanted_lower)]

    if year is not None:
        df = df[df["year"].astype(int) == int(year)]

    if start_year is not None or end_year is not None:
        sy = int(start_year) if start_year is not None else df["year"].min()
        ey = int(end_year) if end_year is not None else df["year"].max()
        df = df[(df["year"].astype(int) >= sy) & (df["year"].astype(int) <= ey)]

    if df.empty:
        raise HTTPException(status_code=404, detail="No rows match your filters.")

    # Ensure proper types
    df["year"] = df["year"].astype(int)
    df["ghi_pred"] = pd.to_numeric(df["ghi_pred"], errors="coerce")

    # Return as a plain JSON array of records
    return df[["country", "year", "ghi_pred"]].to_dict(orient="records")

@app.get("/predictions/global-year")
def get_global_year_predictions(
    year: Optional[int] = Query(default=None, description="Exact year filter (e.g., 2030)"),
    start_year: Optional[int] = Query(default=None, description="Inclusive start of year range"),
    end_year: Optional[int] = Query(default=None, description="Inclusive end of year range"),
):
    """
    Returns global mean predictions per year from ai_global_year_predictions_2025_2035_from_full.csv
    Response items look like: {"year": 2029, "global_ghi_mean": 21.8}
    """
    df = _require_csv(GLOBAL_FILE)

    if "year" not in df.columns or "global_ghi_mean" not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"{GLOBAL_FILE.name} must contain columns 'year' and 'global_ghi_mean'"
        )

    if year is not None:
        df = df[df["year"].astype(int) == int(year)]

    if start_year is not None or end_year is not None:
        sy = int(start_year) if start_year is not None else df["year"].min()
        ey = int(end_year) if end_year is not None else df["year"].max()
        df = df[(df["year"].astype(int) >= sy) & (df["year"].astype(int) <= ey)]

    if df.empty:
        raise HTTPException(status_code=404, detail="No rows match your filters.")

    df["year"] = df["year"].astype(int)
    df["global_ghi_mean"] = pd.to_numeric(df["global_ghi_mean"], errors="coerce")

    return df[["year", "global_ghi_mean"]].to_dict(orient="records")


@app.get("/")
def root_read():
    return {"status": "Health Check Successful!"}

@app.get("/predictionAnalysis")
def predict_hunger():
    # EXCEL_PATH = Path("data/2024.xlsx")
    # df = load_dataframe(EXCEL_PATH)
    try:
        return main_predict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    
    
