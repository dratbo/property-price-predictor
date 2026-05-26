import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from .database import fetch_properties

MODEL_PATH = Path(os.getenv("MODEL_PATH", "models/price_model.joblib"))
MIN_SAMPLES = int(os.getenv("MIN_TRAIN_SAMPLES", "5"))

NUMERIC_FEATURES = ["area", "rooms", "floor", "total_floors", "year_built"]
CATEGORICAL_FEATURES = [
    "city",
    "district",
    "metro",
    "building_type",
    "developer",
    "repair_type",
]


def _prepare_dataframe(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    for col in NUMERIC_FEATURES + CATEGORICAL_FEATURES:
        if col not in df.columns:
            df[col] = None
    for col in NUMERIC_FEATURES:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna("unknown").astype(str)
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["area", "rooms", "city", "price"])
    df = df[df["price"] > 0]
    return df


def _numeric_defaults(df: pd.DataFrame) -> dict[str, float]:
    defaults = {}
    for col in NUMERIC_FEATURES:
        median = df[col].median()
        defaults[col] = float(median) if pd.notna(median) else 0.0
    return defaults


def build_pipeline() -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_FEATURES),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                CATEGORICAL_FEATURES,
            ),
        ]
    )
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        random_state=42,
        n_jobs=-1,
    )
    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )


def _rmse(y_true, y_pred) -> float:
    return float(np.sqrt(mean_squared_error(y_true, y_pred)))


def train_and_save() -> dict:
    rows = fetch_properties()
    df = _prepare_dataframe(rows)

    if len(df) < MIN_SAMPLES:
        raise ValueError(
            f"Not enough data to train model: {len(df)} samples (min {MIN_SAMPLES})"
        )

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = np.log1p(df["price"])
    defaults = _numeric_defaults(df)

    pipeline = build_pipeline()

    if len(df) >= 10:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        pipeline.fit(X_train, y_train)
        preds = pipeline.predict(X_test)
        y_test_r = np.expm1(y_test)
        preds_r = np.expm1(preds)
        metrics = {
            "mae": float(mean_absolute_error(y_test_r, preds_r)),
            "rmse": _rmse(y_test_r, preds_r),
            "r2": float(r2_score(y_test_r, preds_r)),
            "samples_train": len(X_train),
            "samples_test": len(X_test),
        }
    else:
        pipeline.fit(X, y)
        preds = pipeline.predict(X)
        y_r = np.expm1(y)
        preds_r = np.expm1(preds)
        metrics = {
            "mae": float(mean_absolute_error(y_r, preds_r)),
            "rmse": _rmse(y_r, preds_r),
            "r2": float(r2_score(y_r, preds_r)),
            "samples_train": len(X),
            "samples_test": 0,
        }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "defaults": defaults}, MODEL_PATH)
    metrics["total_samples"] = len(df)
    return metrics


def _load_bundle() -> dict:
    if not MODEL_PATH.exists():
        train_and_save()
    bundle = joblib.load(MODEL_PATH)
    if isinstance(bundle, Pipeline):
        return {"pipeline": bundle, "defaults": {col: 0.0 for col in NUMERIC_FEATURES}}
    return bundle


def predict_price(features: dict) -> float:
    bundle = _load_bundle()
    pipeline = bundle["pipeline"]
    defaults = bundle.get("defaults", {})

    row = {col: features.get(col) for col in NUMERIC_FEATURES + CATEGORICAL_FEATURES}
    for col in CATEGORICAL_FEATURES:
        if row.get(col) in (None, ""):
            row[col] = "unknown"
    for col in NUMERIC_FEATURES:
        val = row.get(col)
        if val is None or val == "":
            row[col] = defaults.get(col, 0.0)
        else:
            num = pd.to_numeric(val, errors="coerce")
            row[col] = float(num) if pd.notna(num) else defaults.get(col, 0.0)

    df = pd.DataFrame([row])
    log_price = pipeline.predict(df)[0]
    return float(max(0, np.expm1(log_price)))
