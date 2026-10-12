import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/priority", tags=["priority"])


@router.get("")
def list_priorities(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = (
        db.query(models.PriorityScore, models.Scan, models.Field, models.Farm)
        .join(models.Scan, models.PriorityScore.scan_id == models.Scan.id)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .join(models.Farm, models.Field.farm_id == models.Farm.id)
        .filter(models.Farm.owner_id == user.id, models.Scan.status == "active")
        .order_by(models.PriorityScore.score.desc())
        .all()
    )

    result = []
    for priority, scan, field, farm in rows:
        result.append(
            {
                "priority_id": priority.id,
                "scan_id": scan.id,
                "score": priority.score,
                "tier": priority.tier,
                "reasons": json.loads(priority.reasons_json),
                "factors": json.loads(priority.factors_json),
                "disease_name": scan.disease_name,
                "severity": scan.severity,
                "confidence": scan.confidence,
                "affected_area_pct": scan.affected_area_pct,
                "issue_type": scan.issue_type,
                "field_name": field.name,
                "crop": field.crop,
                "farm_name": farm.name,
                "image_path": scan.image_path,
                "computed_at": priority.computed_at,
            }
        )
    return result


@router.get("/{scan_id}")
def get_priority(scan_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = (
        db.query(models.PriorityScore, models.Scan, models.Field, models.Farm)
        .join(models.Scan, models.PriorityScore.scan_id == models.Scan.id)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .join(models.Farm, models.Field.farm_id == models.Farm.id)
        .filter(models.Scan.id == scan_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Priority not found for this scan")
    priority, scan, field, farm = row
    return {
        "priority_id": priority.id,
        "scan_id": scan.id,
        "score": priority.score,
        "tier": priority.tier,
        "reasons": json.loads(priority.reasons_json),
        "factors": json.loads(priority.factors_json),
        "disease_name": scan.disease_name,
        "severity": scan.severity,
        "confidence": scan.confidence,
        "affected_area_pct": scan.affected_area_pct,
        "issue_type": scan.issue_type,
        "field_name": field.name,
        "crop": field.crop,
        "growth_stage": field.growth_stage,
        "farm_name": farm.name,
        "farm_id": farm.id,
        "field_id": field.id,
        "image_path": scan.image_path,
    }
