# import pandas as pd
# from pathlib import Path


# YEARS_NEEDED = {"2000", "2008", "2016", "2024"}


# def normalize_cols(cols):
#     return [str(c).strip() for c in cols]

# def _find_country_col(df: pd.DataFrame) -> str | None:
#     """Heuristic to find the country column."""
#     lower = {c.lower(): c for c in df.columns}
#     for cand in ("country", "country name", "nation", "state", "location", "area"):
#         if cand in lower:
#             return lower[cand]
#     # fallback: first non-year object column
#     for c in df.columns:
#         if c not in YEARS_NEEDED and df[c].dtype == object:
#             return c
#     return None

# def sheet_has_years_with_header(xls: pd.ExcelFile, sheet_name: str) -> tuple[bool, int | None]:
#     """
#     Try to detect whether a sheet contains the required year columns.
#     Returns (has_years, header_row_index_used or None).
#     Strategy:
#       1) Try default header=0
#       2) If not found, scan first ~15 rows to pick a header row that contains all years
#     """
#     # 1) Try header=0
#     try:
#         df0 = xls.parse(sheet_name, header=0)
#         cols0 = set(normalize_cols(df0.columns))
#         if YEARS_NEEDED.issubset(cols0):
#             return True, 0
#     except Exception:
#         pass

#     # 2) Try scanning possible header rows
#     try:
#         raw = xls.parse(sheet_name, header=None)
#     except Exception:
#         return (False, None)

#     scan_rows = min(15, len(raw))
#     for r in range(scan_rows):
#         candidate_cols = set(normalize_cols(raw.iloc[r].tolist()))
#         if YEARS_NEEDED.issubset(candidate_cols):
#             return True, r

#     return (False, None)


# def load_dataframe(path: Path) -> pd.DataFrame:
#     if not path.exists():
#         raise FileNotFoundError(f"Could not find file: {path.resolve()}")

#     xls = pd.ExcelFile(path, engine="openpyxl")

#     chosen_sheet = None
#     chosen_header = None

#     # 1) Find a sheet with all year columns
#     for sh in xls.sheet_names:
#         ok, hdr = sheet_has_years_with_header(xls, sh)
#         if ok:
#             chosen_sheet, chosen_header = sh, hdr
#             break

#     # 2) Fallback: if none has *all* years, accept a sheet that has *some* of them
#     if chosen_sheet is None:
#         for sh in xls.sheet_names:
#             try:
#                 tmp = xls.parse(sh, header=0)
#                 cols = set(normalize_cols(tmp.columns))
#                 if len(cols.intersection(YEARS_NEEDED)) >= 2:  # partial match
#                     chosen_sheet, chosen_header = sh, 0
#                     break
#             except Exception:
#                 continue

#     if chosen_sheet is None:
#         # last resort: first sheet
#         chosen_sheet, chosen_header = xls.sheet_names[0], 0

#     # Parse with the decided header
#     df = xls.parse(chosen_sheet, header=chosen_header)
#     df.columns = normalize_cols(df.columns)

#     print(f"\n[OK] Loaded sheet: '{chosen_sheet}' using header row index: {chosen_header}")
#     print(f"[INFO] DataFrame shape: {df.shape}")
#     print(f"[INFO] Columns: {list(df.columns)}\n")
#     print(df.head(10))

#     OUTPUT_DIR = Path("data/processed")
#     OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

#      # 1) Save the full detected frame
#     out_full = OUTPUT_DIR / "loaded_full.csv"
#     df.to_csv(out_full, index=False, encoding="utf-8")
#     print(f"\n[OK] Wrote full CSV to: {out_full.resolve()}  (rows={len(df)})")

#     # 2) Save years-only subset (country + the four years, when present)
#     years_present = [y for y in ("2000", "2008", "2016", "2024") if y in df.columns]
#     country_col = _find_country_col(df)

#     if years_present:
#         subset_cols = years_present.copy()
#         if country_col:
#             subset_cols = [country_col] + subset_cols
#         df_subset = df[subset_cols].copy()
#         # Ensure numeric years
#         for y in years_present:
#             df_subset[y] = pd.to_numeric(df_subset[y], errors="coerce")
#         out_years = OUTPUT_DIR / "years_only.csv"
#         df_subset.to_csv(out_years, index=False, encoding="utf-8")
#         print(f"[OK] Wrote years-only CSV to: {out_years.resolve()}  (rows={len(df_subset)})")
#     else:
#         print("[WARN] None of the target year columns (2000, 2008, 2016, 2024) were found after parsing.")
    
#     return df


# if __name__ == "__main__":
#     EXCEL_PATH = Path("data/2024.xlsx")
#     df = load_dataframe(EXCEL_PATH)
    
# setup_and_preprocess.py
# Drop-in replacement that supports MORE year columns automatically
# (handles headers like "2024\n'19-'23" by extracting the leading year)

import re
from pathlib import Path
import pandas as pd

# 👉 Add or remove years here (strings). Order controls the CSV column order.
TARGET_YEARS = [
    "2000", "2007", "2008", "2014", "2015", "2016", "2022", "2023", "2024",
]


def normalize_cols(cols):
    """Trim whitespace from column labels (stringify first)."""
    return [str(c).strip() for c in cols]


def canonical_year(label: str) -> str | None:
    """
    Return a four-digit YEAR string if the column *starts* with one (e.g.
    '2024\\n'19-'23' -> '2024'), otherwise None.
    """
    if label is None:
        return None
    m = re.match(r"^\s*(19|20)\d{2}", str(label))
    return m.group(0) if m else None


def build_year_map(df: pd.DataFrame) -> dict[str, str]:
    """
    Build a mapping {canonical_year -> actual_column_name_in_df} for all
    columns that *start* with a 4-digit year.
    If multiple columns begin with the same year, the first one wins.
    """
    year_map: dict[str, str] = {}
    for col in df.columns:
        y = canonical_year(col)
        if y and y not in year_map:
            year_map[y] = col
    return year_map


def _find_country_col(df: pd.DataFrame) -> str | None:
    """Heuristic to find the country column."""
    lower = {c.lower(): c for c in df.columns}
    for cand in ("country", "country name", "nation", "state", "location", "area"):
        if cand in lower:
            return lower[cand]
    # fallback: first non-year object-like column
    year_map = build_year_map(df)
    for c in df.columns:
        if canonical_year(str(c)) not in year_map and df[c].dtype == object:
            return c
    return None


def sheet_has_years_with_header(xls: pd.ExcelFile, sheet_name: str) -> tuple[bool, int | None]:
    """
    Detect whether a sheet contains *all* TARGET_YEARS (by leading year token).
    Returns (has_all_target_years, header_row_index_used or None).
    Strategy:
      1) Try default header=0
      2) If not found, scan first ~15 rows to pick a header row that contains all years
    """
    # 1) header=0
    try:
        df0 = xls.parse(sheet_name, header=0)
        df0.columns = normalize_cols(df0.columns)
        year_map = build_year_map(df0)
        if set(TARGET_YEARS).issubset(year_map.keys()):
            return True, 0
    except Exception:
        pass

    # 2) scan candidate header rows
    try:
        raw = xls.parse(sheet_name, header=None)
    except Exception:
        return (False, None)

    scan_rows = min(15, len(raw))
    for r in range(scan_rows):
        cols = normalize_cols(raw.iloc[r].tolist())
        # pretend these are header names and see if we can map years
        fake_df = pd.DataFrame(columns=cols)
        year_map = build_year_map(fake_df)
        if set(TARGET_YEARS).issubset(year_map.keys()):
            return True, r

    return (False, None)


def load_dataframe(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Could not find file: {path.resolve()}")

    xls = pd.ExcelFile(path, engine="openpyxl")

    chosen_sheet: str | None = None
    chosen_header: int | None = None

    # 1) Prefer a sheet that contains *all* target years
    for sh in xls.sheet_names:
        ok, hdr = sheet_has_years_with_header(xls, sh)
        if ok:
            chosen_sheet, chosen_header = sh, hdr
            break

    # 2) Fallback: accept a sheet that has *some* of them
    if chosen_sheet is None:
        for sh in xls.sheet_names:
            try:
                tmp = xls.parse(sh, header=0)
                tmp.columns = normalize_cols(tmp.columns)
                year_map = build_year_map(tmp)
                if len(set(TARGET_YEARS).intersection(year_map.keys())) >= 2:
                    chosen_sheet, chosen_header = sh, 0
                    break
            except Exception:
                continue

    # 3) Last resort: first sheet
    if chosen_sheet is None:
        chosen_sheet, chosen_header = xls.sheet_names[0], 0

    # Parse with the decided header
    df = xls.parse(chosen_sheet, header=chosen_header)
    df.columns = normalize_cols(df.columns)

    print(f"\n[OK] Loaded sheet: '{chosen_sheet}' using header row index: {chosen_header}")
    print(f"[INFO] DataFrame shape: {df.shape}")
    print(f"[INFO] Columns: {list(df.columns)}\n")
    print(df.head(10))

    OUTPUT_DIR = Path("data/processed")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1) Save the full detected frame
    out_full = OUTPUT_DIR / "loaded_full.csv"
    df.to_csv(out_full, index=False, encoding="utf-8")
    print(f"\n[OK] Wrote full CSV to: {out_full.resolve()}  (rows={len(df)})")

    # 2) Save years-only subset (country + TARGET_YEARS, when present)
    year_map = build_year_map(df)  # { "2000": actual_col_name, ... }
    years_present = [y for y in TARGET_YEARS if y in year_map]
    country_col = _find_country_col(df)

    if years_present:
        subset_cols_actual = [year_map[y] for y in years_present]
        subset = df[subset_cols_actual].copy()
        # Rename actual headers to canonical year labels
        subset.columns = years_present
        if country_col:
            subset.insert(0, "country", df[country_col])

        # Ensure numeric years
        for y in years_present:
            subset[y] = pd.to_numeric(subset[y], errors="coerce")

        out_years = OUTPUT_DIR / "years_only.csv"
        subset.to_csv(out_years, index=False, encoding="utf-8")
        print(
            f"[OK] Wrote years-only CSV to: {out_years.resolve()} "
            f"(rows={len(subset)}, years={years_present})"
        )
    else:
        print(f"[WARN] None of the target year columns {TARGET_YEARS} were found after parsing.")

    return df


if __name__ == "__main__":
    EXCEL_PATH = Path("data/2024.xlsx")  # adjust as needed
    _ = load_dataframe(EXCEL_PATH)
