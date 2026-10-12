"""
Economic Loss Prediction.

Real deterministic model based on severity, affected area, days untreated,
and the field's own crop price / expected yield (user-entered, real data --
never hardcoded). If the field hasn't set a crop price or expected yield,
we return None fields and let the frontend show a "add crop economics"
prompt rather than fabricating currency figures.
"""
from typing import Optional

SEVERITY_DAILY_LOSS_RATE = {"low": 0.006, "medium": 0.016, "high": 0.032}


def estimate_economic_risk(
    severity: str,
    affected_area_pct: float,
    field_size_acres: Optional[float],
    crop_price_per_kg: Optional[float],
    expected_yield_kg_per_acre: Optional[float],
    days_untreated: int = 5,
):
    daily_rate = SEVERITY_DAILY_LOSS_RATE.get((severity or "low").lower(), 0.006)
    area_factor = min(affected_area_pct / 100.0, 1.0)

    # Compounding-ish yield loss curve, capped at 60% for a 5-30 day horizon
    yield_loss_pct = min(daily_rate * days_untreated * (1 + area_factor) * 100, 60.0)
    yield_loss_pct = round(yield_loss_pct, 1)

    result = {
        "days_untreated": days_untreated,
        "estimated_yield_loss_pct": yield_loss_pct,
        "estimated_financial_loss": None,
        "treatment_cost_estimate": None,
        "potential_savings": None,
        "currency": "INR",
    }

    if field_size_acres and crop_price_per_kg and expected_yield_kg_per_acre:
        total_expected_yield_kg = field_size_acres * expected_yield_kg_per_acre
        lost_yield_kg = total_expected_yield_kg * (yield_loss_pct / 100.0)
        financial_loss = round(lost_yield_kg * crop_price_per_kg, 2)

        # Treatment cost heuristic: proportional to field size + severity
        severity_cost_factor = {"low": 300, "medium": 550, "high": 900}.get(
            (severity or "low").lower(), 300
        )
        treatment_cost = round(field_size_acres * severity_cost_factor, 2)
        potential_savings = round(max(financial_loss - treatment_cost, 0), 2)

        result.update(
            {
                "estimated_financial_loss": financial_loss,
                "treatment_cost_estimate": treatment_cost,
                "potential_savings": potential_savings,
            }
        )

    return result
