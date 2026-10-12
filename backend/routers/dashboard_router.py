import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

SEVERITY_PENALTY = {"low": 5, "medium": 15, "high": 30}


@router.get("/summary")
def summary(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    farms = db.query(models.Farm).filter(models.Farm.owner_id == user.id).all()
    farm_ids = [f.id for f in farms]

    if not farm_ids:
        return {"has_data": False}

    active_scans = (
        db.query(models.Scan)
        .join(models.Field)
        .filter(models.Field.farm_id.in_(farm_ids), models.Scan.status == "active", models.Scan.issue_type != "healthy")
        .all()
    )

    all_scans = (
        db.query(models.Scan).join(models.Field).filter(models.Field.farm_id.in_(farm_ids)).all()
    )

    if not all_scans:
        return {
            "has_data": True,
            "has_scans": False,
            "farm_count": len(farms),
            "field_count": db.query(models.Field).filter(models.Field.farm_id.in_(farm_ids)).count(),
        }

    # Farm health score: starts at 100, penalized by each active issue's severity
    health_score = 100
    for s in active_scans:
        health_score -= SEVERITY_PENALTY.get((s.severity or "low").lower(), 5)
    health_score = max(health_score, 0)

    top_priority = (
        db.query(models.PriorityScore, models.Scan)
        .join(models.Scan, models.PriorityScore.scan_id == models.Scan.id)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .filter(models.Field.farm_id.in_(farm_ids), models.Scan.status == "active")
        .order_by(models.PriorityScore.score.desc())
        .first()
    )

    top_priority_data = None
    if top_priority:
        priority, scan = top_priority
        top_priority_data = {
            "disease_name": scan.disease_name,
            "tier": priority.tier,
            "score": priority.score,
            "scan_id": scan.id,
        }

    treatments = (
        db.query(models.Treatment)
        .join(models.Scan)
        .join(models.Field)
        .filter(models.Field.farm_id.in_(farm_ids))
        .all()
    )
    completed = len([t for t in treatments if t.status == "completed"])

    recent_scans = sorted(all_scans, key=lambda s: s.created_at, reverse=True)[:5]

    # Priority distribution for chart
    priorities = (
        db.query(models.PriorityScore)
        .join(models.Scan, models.PriorityScore.scan_id == models.Scan.id)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .filter(models.Field.farm_id.in_(farm_ids), models.Scan.status == "active")
        .all()
    )
    tier_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for p in priorities:
        tier_counts[p.tier] = tier_counts.get(p.tier, 0) + 1

    # Farm health trend approximation from scan history (chronological penalty)
    trend = []
    running_health = 100
    for s in sorted(all_scans, key=lambda x: x.created_at):
        if s.issue_type != "healthy":
            running_health -= SEVERITY_PENALTY.get((s.severity or "low").lower(), 5) * 0.3
        running_health = max(min(running_health, 100), 0)
        trend.append({"date": s.created_at.strftime("%Y-%m-%d"), "health": round(running_health, 1)})

    return {
        "has_data": True,
        "has_scans": True,
        "farm_count": len(farms),
        "field_count": db.query(models.Field).filter(models.Field.farm_id.in_(farm_ids)).count(),
        "farm_health_score": health_score,
        "active_issues_count": len(active_scans),
        "top_priority": top_priority_data,
        "treatments_completed": completed,
        "treatments_total": len(treatments),
        "recent_scans": [
            {
                "id": s.id,
                "disease_name": s.disease_name,
                "severity": s.severity,
                "created_at": s.created_at.isoformat(),
                "image_path": s.image_path,
            }
            for s in recent_scans
        ],
        "priority_distribution": tier_counts,
        "health_trend": trend[-15:],
    }
