import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user
from services.ai_service import chat_completion, is_configured
from services.weather_service import get_weather

router = APIRouter(prefix="/api/rescue", tags=["rescue"])

SYSTEM_PROMPT = """You are an agricultural AI advisor inside AI Farm Guardian.
Given structured facts about a farmer's crop issue, produce a JSON object with
exactly these keys: immediate_action, organic_treatment, chemical_treatment,
application_guidance, recovery_time, prevention, weather_consideration.
Each value should be a concise, practical string (2-4 sentences max).
Always include a safety note inside chemical_treatment reminding the farmer
to follow local agricultural guidance and product labels.
Return ONLY valid JSON, no markdown fences, no extra text."""


@router.get("/{scan_id}")
async def get_rescue_plan(scan_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = (
        db.query(models.Scan, models.Field, models.Farm)
        .join(models.Field, models.Scan.field_id == models.Field.id)
        .join(models.Farm, models.Field.farm_id == models.Farm.id)
        .filter(models.Scan.id == scan_id, models.Farm.owner_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan, field, farm = row

    if not is_configured():
        return {"connected": False, "reason": "GROQ_API_KEY not configured", "plan": None}

    weather = None
    if farm.latitude and farm.longitude:
        weather = await get_weather(farm.latitude, farm.longitude)

    facts = {
        "crop": field.crop,
        "growth_stage": field.growth_stage,
        "disease_name": scan.disease_name,
        "severity": scan.severity,
        "confidence": scan.confidence,
        "affected_area_pct": scan.affected_area_pct,
        "issue_type": scan.issue_type,
        "weather": weather,
    }

    user_message = "Generate a rescue plan as JSON for this situation:\n" + json.dumps(facts)

    raw = await chat_completion(SYSTEM_PROMPT, user_message)
    if raw is None:
        return {"connected": False, "reason": "AI request failed", "plan": None}

    try:
        cleaned = raw.strip().strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        plan = json.loads(cleaned)
    except Exception:
        plan = {"immediate_action": raw, "organic_treatment": "", "chemical_treatment": "",
                 "application_guidance": "", "recovery_time": "", "prevention": "",
                 "weather_consideration": ""}

    return {"connected": True, "reason": None, "plan": plan, "facts": facts}
