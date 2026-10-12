from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models, schemas
from auth import get_current_user

router = APIRouter(prefix="/api/treatments", tags=["treatments"])


@router.get("", response_model=List[schemas.TreatmentOut])
def list_treatments(scan_id: Optional[int] = None, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    q = (
        db.query(models.Treatment)
        .join(models.Scan, models.Treatment.scan_id == models.Scan.id)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .join(models.Farm, models.Field.farm_id == models.Farm.id)
        .filter(models.Farm.owner_id == user.id)
    )
    if scan_id:
        q = q.filter(models.Treatment.scan_id == scan_id)
    return q.order_by(models.Treatment.created_at.desc()).all()


@router.post("", response_model=schemas.TreatmentOut)
def create_treatment(payload: schemas.TreatmentCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    scan = (
        db.query(models.Scan)
        .join(models.Field)
        .join(models.Farm)
        .filter(models.Scan.id == payload.scan_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    treatment = models.Treatment(**payload.dict())
    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment


@router.put("/{treatment_id}", response_model=schemas.TreatmentOut)
def update_treatment(treatment_id: int, payload: schemas.TreatmentUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    treatment = (
        db.query(models.Treatment)
        .join(models.Scan)
        .join(models.Field)
        .join(models.Farm)
        .filter(models.Treatment.id == treatment_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")

    if payload.status:
        treatment.status = payload.status
        if payload.status == "completed":
            treatment.applied_at = datetime.utcnow()
    if payload.notes is not None:
        treatment.notes = payload.notes

    db.commit()
    db.refresh(treatment)
    return treatment


@router.delete("/{treatment_id}")
def delete_treatment(treatment_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    treatment = (
        db.query(models.Treatment)
        .join(models.Scan)
        .join(models.Field)
        .join(models.Farm)
        .filter(models.Treatment.id == treatment_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not treatment:
        raise HTTPException(status_code=404, detail="Treatment not found")
    db.delete(treatment)
    db.commit()
    return {"ok": True}
