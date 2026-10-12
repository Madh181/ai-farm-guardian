from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user
from services.economic_engine import estimate_economic_risk

router = APIRouter(prefix="/api/economic", tags=["economic"])


@router.get("")
def economic_overview(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    scans = (
        db.query(models.Scan, models.Field)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .join(models.Farm, models.Field.farm_id == models.Farm.id)
        .filter(models.Farm.owner_id == user.id, models.Scan.status == "active")
        .all()
    )

    results = []
    for scan, field in scans:
        risk = estimate_economic_risk(
            severity=scan.severity,
            affected_area_pct=scan.affected_area_pct or 0,
            field_size_acres=field.size_acres,
            crop_price_per_kg=field.crop_price_per_kg,
            expected_yield_kg_per_acre=field.expected_yield_kg_per_acre,
        )
        results.append(
            {
                "scan_id": scan.id,
                "field_name": field.name,
                "crop": field.crop,
                "disease_name": scan.disease_name,
                "severity": scan.severity,
                "needs_crop_economics": not (field.crop_price_per_kg and field.expected_yield_kg_per_acre),
                **risk,
            }
        )
    return results


@router.get("/{scan_id}")
def economic_for_scan(scan_id: int, days: int = Query(5), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = (
        db.query(models.Scan, models.Field)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .join(models.Farm, models.Field.farm_id == models.Farm.id)
        .filter(models.Scan.id == scan_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan, field = row
    risk = estimate_economic_risk(
        severity=scan.severity,
        affected_area_pct=scan.affected_area_pct or 0,
        field_size_acres=field.size_acres,
        crop_price_per_kg=field.crop_price_per_kg,
        expected_yield_kg_per_acre=field.expected_yield_kg_per_acre,
        days_untreated=days,
    )
    return {
        "needs_crop_economics": not (field.crop_price_per_kg and field.expected_yield_kg_per_acre),
        **risk,
    }
