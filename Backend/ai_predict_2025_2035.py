from pathlib import Path
import numpy as np
import pandas as pd

from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, PolynomialFeatures
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline

IN_PATH = Path("data/processed/loaded_full.csv")   # adjust if your file lives elsewhere
OUT_DIR = Path("data/processed")

# ***** CHANGED: restrict predictions to 2025..2030 *****
PRED_YEARS = list(range(2025, 2031))               # 2025, 2026, 2027, 2028, 2029, 2030

# Anchor years we actually have in the merged dataset
ANCHOR_YEARS = {2000, 2007, 2008, 2014, 2015, 2016, 2022, 2023, 2024}

CLIP_MIN, CLIP_MAX = 0.0, 100.0                    # sensible bounds for GHI-like scores

# ----------------- Helpers -----------------

class CountryBasisInteraction(BaseEstimator, TransformerMixin):
    """Stack [OHE, basis, OHE*basis]; basis is [year_c, year_c^2]."""
    def __init__(self, n_basis=2):
        self.n_basis = n_basis
    def fit(self, X, y=None):
        return self
    def transform(self, X):
        ohe   = X[:, :-self.n_basis]
        basis = X[:, -self.n_basis:]
        inter = np.einsum("ij,ik->ijk", ohe, basis).reshape(X.shape[0], -1)
        return np.hstack([ohe, basis, inter])

def _normalize_cols(cols):
    return [str(c).strip() for c in cols]

def _find_country_col(df: pd.DataFrame) -> str:
    lower = {c.lower(): c for c in df.columns}
    for cand in ("country", "country name", "nation", "state", "location", "area"):
        if cand in lower:
            return lower[cand]
    # fallback: first non-year object/text column
    for c in df.columns:
        if not str(c).isdigit() and df[c].dtype == object:
            return c
    raise ValueError("Could not detect a country column. Rename it to 'Country' or similar.")

def _detect_long_target_column(df: pd.DataFrame) -> str | None:
    """In a long table, guess the target column name."""
    lower = {c.lower(): c for c in df.columns}
    for cand in ("ghi", "value", "score", "index"):
        if cand in lower:
            return lower[cand]
    # fallback: last numeric column that is not 'year'
    num_cols = [c for c in df.columns if c != "year" and pd.api.types.is_numeric_dtype(df[c])]
    return num_cols[-1] if num_cols else None

def _to_long_country_year_value(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert loaded_full into long format with columns: country, year, value
    - If wide (year columns exist): melt those year columns.
    - If long (has 'year'): pick a likely target column.
    """
    df = df.copy()
    df.columns = _normalize_cols(df.columns)
    country_col = _find_country_col(df)

    # Wide?
    year_cols = [c for c in df.columns if str(c).isdigit()]
    if year_cols:
        for y in year_cols:
            df[y] = pd.to_numeric(df[y], errors="coerce")
        long_df = df.melt(id_vars=[country_col], value_vars=year_cols,
                          var_name="year", value_name="value")
        long_df.rename(columns={country_col: "country"}, inplace=True)
        long_df["year"] = long_df["year"].astype(int)
        long_df = long_df.dropna(subset=["value"])
        long_df["country"] = long_df["country"].astype(str).str.strip()
        return long_df[["country", "year", "value"]]

    # Long?
    if "year" in df.columns:
        df["year"] = pd.to_numeric(df["year"], errors="coerce").astype("Int64")
        target_col = _detect_long_target_column(df)
        if not target_col:
            raise ValueError("Could not detect a target column in long format (looked for ghi/value/score/index).")
        df[target_col] = pd.to_numeric(df[target_col], errors="coerce")
        out = df[[country_col, "year", target_col]].dropna(subset=[target_col, "year"]).copy()
        out.rename(columns={country_col: "country", target_col: "value"}, inplace=True)
        out["year"] = out["year"].astype(int)
        out["country"] = out["country"].astype(str).str.strip()
        return out[["country", "year", "value"]]

    raise ValueError("Could not determine table shape. Need either year columns (e.g., 2000/2008/2016/2024) or a 'year' column.")

def _prepare_training(long_df: pd.DataFrame) -> pd.DataFrame:
    train = long_df[long_df["year"].isin(ANCHOR_YEARS)].copy()
    if train.empty:
        raise RuntimeError("No training rows found. Ensure loaded_full.csv has values for anchor years.")
    return train

def _build_ohe():
    """Create OneHotEncoder compatible across sklearn versions."""
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)  # sklearn >= 1.2
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)         # sklearn <= 1.1

def _fit_model(train_df: pd.DataFrame) -> Pipeline:
    year0 = train_df["year"].mean()
    train_df = train_df.copy()
    train_df["year_c"] = train_df["year"] - year0

    pre = ColumnTransformer(
        transformers=[
            ("country", _build_ohe(), ["country"]),
            ("year_poly", Pipeline([
                ("poly", PolynomialFeatures(degree=2, include_bias=False))  # [year_c, year_c^2]
            ]), ["year_c"]),
        ],
        remainder="drop",
    )

    pipe = Pipeline(steps=[
        ("pre", pre),
        ("inter", CountryBasisInteraction(n_basis=2)),
        ("model", Ridge(alpha=10.0)),
    ])

    X = train_df[["country", "year_c"]]
    y = train_df["value"].astype(float)
    pipe.fit(X, y)

    # save the center so _predict_for_years can reproduce year_c
    pipe.named_steps["pre"].year_center_ = float(year0)
    return pipe

def _predict_for_years(pipe, countries: list[str], years: list[int]) -> pd.DataFrame:
    year0 = getattr(pipe.named_steps["pre"], "year_center_", None)
    if year0 is None:
        raise RuntimeError("Model preprocessor has no 'year_center_' — make sure you used the updated _fit_model.")

    rows = []
    for c in countries:
        for y in years:
            rows.append({"country": c, "year": y, "year_c": y - year0})
    grid = pd.DataFrame(rows)

    preds = pipe.predict(grid[["country", "year_c"]])
    preds = np.clip(preds, CLIP_MIN, CLIP_MAX)

    grid["ghi_pred"] = preds
    return grid[["country", "year", "ghi_pred"]]

# ----------------- Main -----------------

def main_predict():
    if not IN_PATH.exists():
        raise FileNotFoundError(f"Expected {IN_PATH.resolve()} to exist.")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wide_or_long = pd.read_csv(IN_PATH)
    long_df = _to_long_country_year_value(wide_or_long)
    train = _prepare_training(long_df)

    pipe = _fit_model(train)
    countries = sorted(train["country"].unique())
    preds = _predict_for_years(pipe, countries, PRED_YEARS)

    # ***** CHANGED: filenames reflect 2025_2030 *****
    out_country = OUT_DIR / "ai_country_year_predictions_2025_2030_from_full.csv"
    preds.to_csv(out_country, index=False, encoding="utf-8")

    global_year = (
        preds.groupby("year", as_index=False)["ghi_pred"]
             .mean()
             .rename(columns={"ghi_pred": "global_ghi_mean"})
    )
    out_global = OUT_DIR / "ai_global_year_predictions_2025_2030_from_full.csv"
    global_year.to_csv(out_global, index=False, encoding="utf-8")

    print(f"[OK] Wrote {out_country} (rows={len(preds):,})")
    print(f"[OK] Wrote {out_global} (rows={len(global_year):,})")

    # quick sanity check
    yr = 2027
    print(f"\nSample predictions for {yr}:")
    print(preds[preds['year'] == yr].head(10).to_string(index=False))

    return {
        "countries": len(countries),
        "years_predicted": [min(PRED_YEARS), max(PRED_YEARS)],
        "country_file": str(out_country),
        "global_file": str(out_global),
    }

if __name__ == "__main__":
    main_predict()

