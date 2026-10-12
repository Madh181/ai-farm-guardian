import os
import json
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from database import get_db
import models, schemas
from auth import get_current_user
from services.vision_service import analyze_image_bytes
from services.priority_engine import compute_priority
from services.weather_service import get_weather
from services.economic_engine import estimate_economic_risk

router = APIRouter(prefix="/api/scans", tags=["scans"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _field_owned(db, field_id, user):
    field = (
        db.query(models.Field)
        .join(models.Farm)
        .filter(models.Field.id == field_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


async def _compute_and_store_priority(db: Session, scan: models.Scan, field: models.Field):
    weather = None
    if field.farm and field.farm.latitude and field.farm.longitude:
        weather = await get_weather(field.farm.latitude, field.farm.longitude)

    economic = estimate_economic_risk(
        severity=scan.severity,
        affected_area_pct=scan.affected_area_pct or 0,
        field_size_acres=field.size_acres,
        crop_price_per_kg=field.crop_price_per_kg,
        expected_yield_kg_per_acre=field.expected_yield_kg_per_acre,
    )

    score, tier, reasons, factors = compute_priority(
        severity=scan.severity,
        confidence=scan.confidence or 0,
        affected_area_pct=scan.affected_area_pct or 0,
        issue_type=scan.issue_type,
        growth_stage=field.growth_stage,
        weather=weather,
        economic=economic,
    )

    existing = db.query(models.PriorityScore).filter(models.PriorityScore.scan_id == scan.id).first()
    if existing:
        existing.score = score
        existing.tier = tier
        existing.reasons_json = json.dumps(reasons)
        existing.factors_json = json.dumps(factors)
    else:
        existing = models.PriorityScore(
            scan_id=scan.id,
            score=score,
            tier=tier,
            reasons_json=json.dumps(reasons),
            factors_json=json.dumps(factors),
        )
        db.add(existing)

    if tier in ("CRITICAL", "HIGH"):
        notif = models.Notification(
            user_id=field.farm.owner_id,
            title=f"{tier.title()} priority issue detected",
            message=f"{scan.disease_name} in field '{field.name}' scored {score}/100 priority.",
            level="critical" if tier == "CRITICAL" else "warning",
        )
        db.add(notif)

    db.commit()
    db.refresh(existing)
    return existing


@router.post("", response_model=schemas.ScanOut)
async def create_scan(
    field_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    field = _field_owned(db, field_id, user)

    contents = await file.read()
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    analysis = analyze_image_bytes(contents)

    scan = models.Scan(
        field_id=field_id,
        image_path=f"/uploads/{filename}",
        disease_name=analysis.disease_name,
        confidence=analysis.confidence,
        severity=analysis.severity,
        affected_area_pct=analysis.affected_area_pct,
        issue_type=analysis.issue_type,
        detector_source=analysis.detector_source,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    await _compute_and_store_priority(db, scan, field)

    return scan


@router.get("", response_model=List[schemas.ScanOut])
def list_scans(
    field_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    q = (
        db.query(models.Scan)
        .join(models.Field)
        .join(models.Farm)
        .filter(models.Farm.owner_id == user.id)
    )
    if field_id:
        q = q.filter(models.Scan.field_id == field_id)
    if status:
        q = q.filter(models.Scan.status == status)
    return q.order_by(models.Scan.created_at.desc()).all()


@router.get("/{scan_id}", response_model=schemas.ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    scan = (
        db.query(models.Scan)
        .join(models.Field)
        .join(models.Farm)
        .filter(models.Scan.id == scan_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan


@router.put("/{scan_id}/resolve")
def resolve_scan(scan_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    scan = (
        db.query(models.Scan)
        .join(models.Field)
        .join(models.Farm)
        .filter(models.Scan.id == scan_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan.status = "resolved"
    db.commit()
    return {"ok": True}
