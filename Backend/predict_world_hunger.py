# 02_predict_world_hunger.py
# Minimal deps: pandas, numpy  (no sklearn needed)
# Usage:
#   python 02_predict_world_hunger.py

from pathlib import Path
import numpy as np
import pandas as pd

IN_PATH = Path("data/processed/years_only.csv")
OUT_DIR = Path("data/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_YEARS = list(range(2000, 2031))  # project through 2030 inclusive
CLIP_MIN, CLIP_MAX = 0.0, 100.0         # GHI is typically 0..100; clip to sane bounds

def _find_country_col(df: pd.DataFrame) -> str:
    lower = {c.lower(): c for c in df.columns}
    for cand in ("country", "country name", "nation", "state", "location", "area"):
        if cand in lower:
            return lower[cand]
    # fallback: first non-year object column
    for c in df.columns:
        if c not in {"2000", "2008", "2016", "2024"} and df[c].dtype == object:
            return c
    raise ValueError("Could not find a country-like column in years_only.csv")

def _melt_years(df: pd.DataFrame) -> pd.DataFrame:
    """Wide (country + year cols) -> long (country, year, ghi)"""
    country_col = _find_country_col(df)
    # ensure numeric year columns
    year_cols = [c for c in df.columns if c.isdigit()]
    for c in year_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    long_df = df.melt(id_vars=[country_col], value_vars=year_cols,
                      var_name="year", value_name="ghi")
    long_df.rename(columns={country_col: "country"}, inplace=True)
    long_df["country"] = long_df["country"].astype(str).str.strip()
    long_df["year"] = long_df["year"].astype(int)
    long_df = long_df.dropna(subset=["country"])
    return long_df

def _fit_predict_country(years: np.ndarray, values: np.ndarray, out_years: np.ndarray) -> np.ndarray:
    """
    Fit a simple linear trend (np.polyfit deg=1) and predict on out_years.
    - If only one known point: use a flat line at that value.
    - If all NaN: return NaNs.
    """
    mask = ~np.isnan(values)
    x, y = years[mask], values[mask]
    if len(y) == 0:
        return np.full_like(out_years, np.nan, dtype=float)
    if len(y) == 1:
        return np.full_like(out_years, float(y[0]), dtype=float)
    # Fit y ~ a*year + b
    a, b = np.polyfit(x.astype(float), y.astype(float), deg=1)
    pred = a * out_years.astype(float) + b
    # clip to sensible bounds
    pred = np.clip(pred, CLIP_MIN, CLIP_MAX)
    return pred

def main_predict():
    if not IN_PATH.exists():
        raise FileNotFoundError(f"Expected {IN_PATH.resolve()} to exist. Run the loader first.")
    raw = pd.read_csv(IN_PATH)
    long_df = _melt_years(raw)

    # Keep only the four anchor years if more slipped in
    anchor_years = np.array([2000, 2008, 2016, 2024], dtype=int)
    long_df = long_df[long_df["year"].isin(anchor_years)]

    # Per-country predictions
    countries = sorted(long_df["country"].unique())
    out_years = np.array(TARGET_YEARS, dtype=int)
    rows = []

    for c in countries:
        sub = long_df[long_df["country"] == c].sort_values("year")
        known_years = sub["year"].to_numpy(dtype=int)
        known_vals  = sub["ghi"].to_numpy(dtype=float)
        preds = _fit_predict_country(known_years, known_vals, out_years)
        rows.append(pd.DataFrame({"country": c, "year": out_years, "ghi_pred": preds}))

    country_year_pred = pd.concat(rows, ignore_index=True)

    # Global aggregate (unweighted mean across countries that have a prediction that year)
    global_year = (
        country_year_pred
        .groupby("year", as_index=False)["ghi_pred"]
        .mean()
        .rename(columns={"ghi_pred": "global_ghi_unweighted"})
    )

    # Build a daily series by time-interpolating year→day (Jan 1 of each year)
    # This is for visualization only; GHI is an annual metric.
    # Create a date index from the min to max year
    start_date = f"{min(TARGET_YEARS)}-01-01"
    end_date   = f"{max(TARGET_YEARS)}-12-31"

    # Create annual date points at Jan 1 with the global value
    annual_points = pd.Series(
        data=global_year.set_index(pd.to_datetime(global_year["year"].astype(str) + "-01-01"))["global_ghi_unweighted"],
        index=pd.to_datetime(global_year["year"].astype(str) + "-01-01")
    ).sort_index()

    # Daily range + time interpolation
    daily_index = pd.date_range(start=start_date, end=end_date, freq="D")
    global_daily = (
        annual_points.reindex(
            annual_points.index.union(daily_index)
        ).interpolate(method="time").reindex(daily_index)
    )
    global_daily = global_daily.clip(CLIP_MIN, CLIP_MAX)
    global_daily_df = global_daily.to_frame(name="global_ghi_daily_interp").reset_index().rename(columns={"index": "date"})

    # Save outputs
    out1 = OUT_DIR / "country_year_predictions.csv"
    out2 = OUT_DIR / "global_year_predictions.csv"
    out3 = OUT_DIR / "global_daily_predictions.csv"

    country_year_pred.to_csv(out1, index=False)
    global_year.to_csv(out2, index=False)
    global_daily_df.to_csv(out3, index=False)

    # Log a quick preview
    print(f"[OK] Wrote {out1} (rows={len(country_year_pred):,})")
    print(f"[OK] Wrote {out2} (rows={len(global_year):,})")
    print(f"[OK] Wrote {out3} (rows={len(global_daily_df):,})")
    print("\nSample global yearly predictions:")
    print(global_year.head(10).to_string(index=False))
    print("\nSample global DAILY predictions:")
    print(global_daily_df.head(10).to_string(index=False))

if __name__ == "__main__":
    main_predict()
