"""
Dynamic Intervention Prioritization engine.

This is a transparent, deterministic weighted-scoring model -- every input
listed in the product spec is actually used in the computation below, and
the score changes whenever any input changes. It is NOT a lookup table.

To upgrade to a trained XGBoost model later: replace `compute_priority()`'s
body with `model.predict(feature_vector)`, keeping the same function
signature and the same `factors` dict as your feature vector. Everything
else in the app (API, frontend) only depends on the returned score/tier/
reasons, so the swap is drop-in.
"""
from typing import Optional

SEVERITY_WEIGHT = {"low": 25, "medium": 60, "high": 95}
STAGE_VULNERABILITY = {
    "seedling": 90,
    "vegetative": 60,
    "flowering": 85,
    "maturity": 40,
}
ISSUE_SPREAD_RISK = {
    "disease": 80,
    "pest": 70,
    "water_stress": 40,
    "nutrient": 35,
    "healthy": 0,
}


def _weather_risk(weather: Optional[dict]) -> float:
    """0-100 risk contribution from live weather. Returns 0 (neutral) if
    weather data isn't available -- we never invent weather."""
    if not weather:
        return 0.0
    humidity = weather.get("humidity", 50)
    rain_prob = weather.get("rain_probability", 0)
    temp = weather.get("temperature", 25)

    risk = 0.0
    if humidity >= 80:
        risk += 30
    elif humidity >= 60:
        risk += 15

    if rain_prob >= 60:
        risk += 25
    elif rain_prob >= 30:
        risk += 10

    if 20 <= temp <= 30:
        risk += 15  # favorable range for many fungal pathogens

    return min(risk, 100.0)


def _economic_weight(economic: Optional[dict]) -> float:
    if not economic:
        return 0.0
    loss_pct = economic.get("estimated_yield_loss_pct", 0)
    return min(loss_pct * 2.2, 100.0)


def compute_priority(
    severity: str,
    confidence: float,
    affected_area_pct: float,
    issue_type: str,
    growth_stage: Optional[str],
    weather: Optional[dict] = None,
    economic: Optional[dict] = None,
):
    severity_score = SEVERITY_WEIGHT.get((severity or "low").lower(), 25)
    stage_score = STAGE_VULNERABILITY.get((growth_stage or "vegetative").lower(), 50)
    spread_score = ISSUE_SPREAD_RISK.get((issue_type or "disease").lower(), 50)
    area_score = min(affected_area_pct * 2.0, 100.0)
    confidence_factor = max(min(confidence, 100.0), 0.0) / 100.0
    weather_score = _weather_risk(weather)
    economic_score = _economic_weight(economic)

    # Weighted blend -- weights sum to 1.0
    raw_score = (
        severity_score * 0.28
        + area_score * 0.16
        + spread_score * 0.16
        + stage_score * 0.14
        + weather_score * 0.14
        + economic_score * 0.12
    )
    # Confidence discounts the score toward "uncertain -> lower urgency"
    final_score = round(raw_score * (0.55 + 0.45 * confidence_factor), 1)
    final_score = max(0.0, min(final_score, 100.0))

    if final_score >= 85:
        tier = "CRITICAL"
    elif final_score >= 65:
        tier = "HIGH"
    elif final_score >= 40:
        tier = "MEDIUM"
    else:
        tier = "LOW"

    reasons = []
    if severity_score >= 80:
        reasons.append("High disease severity detected in scan")
    elif severity_score >= 50:
        reasons.append("Moderate disease severity detected")

    if area_score >= 50:
        reasons.append(f"Large affected area ({affected_area_pct}% of leaf tissue)")

    if spread_score >= 70:
        reasons.append(f"High spread risk for issue type '{issue_type}'")

    if stage_score >= 80:
        reasons.append(f"Crop is in a vulnerable growth stage ('{growth_stage}')")

    if weather_score >= 40:
        reasons.append("Current weather conditions favor disease progression")
    elif weather is None:
        reasons.append("Weather data not connected -- prioritization excludes weather risk")

    if economic_score >= 40:
        reasons.append("Significant projected economic impact if untreated")

    if confidence_factor < 0.7:
        reasons.append(f"Detection confidence is moderate ({confidence}%) -- verify manually")

    if not reasons:
        reasons.append("No strong risk signals -- routine monitoring is sufficient")

    factors = {
        "severity_score": severity_score,
        "area_score": round(area_score, 1),
        "spread_score": spread_score,
        "stage_score": stage_score,
        "weather_score": round(weather_score, 1),
        "economic_score": round(economic_score, 1),
        "confidence_pct": confidence,
    }

    return final_score, tier, reasons, factors
