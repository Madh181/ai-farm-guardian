import json
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
import models, schemas
from auth import get_current_user
from services.ai_service import chat_completion, is_configured
from services.weather_service import get_weather

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = """You are the AI Farm Assistant inside AI Farm Guardian, a
crop health monitoring platform. Answer the farmer's question directly and
practically, using the farm/crop/weather context provided when relevant.
Keep answers concise (3-6 sentences) and actionable. If you don't have
enough context to be specific, say so and ask what's needed."""


@router.get("/history", response_model=List[schemas.ChatMessageOut])
def history(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == user.id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )


@router.delete("/history")
def clear_history(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user.id).delete()
    db.commit()
    return {"ok": True}


@router.post("")
async def send_message(payload: schemas.ChatRequest, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not is_configured():
        return {"connected": False, "reason": "GROQ_API_KEY not configured", "reply": None}

    user_msg = models.ChatMessage(user_id=user.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    context_parts = []
    if payload.field_id:
        field = db.query(models.Field).filter(models.Field.id == payload.field_id).first()
        if field:
            context_parts.append(f"Crop: {field.crop}, growth stage: {field.growth_stage}")
            latest_scan = (
                db.query(models.Scan)
                .filter(models.Scan.field_id == field.id, models.Scan.status == "active")
                .order_by(models.Scan.created_at.desc())
                .first()
            )
            if latest_scan:
                context_parts.append(
                    f"Latest detected issue: {latest_scan.disease_name}, severity {latest_scan.severity}, "
                    f"affected area {latest_scan.affected_area_pct}%"
                )
            if field.farm and field.farm.latitude and field.farm.longitude:
                weather = await get_weather(field.farm.latitude, field.farm.longitude)
                if weather:
                    context_parts.append(
                        f"Current weather: {weather['temperature']}C, humidity {weather['humidity']}%, "
                        f"rain probability {weather['rain_probability']}%"
                    )

    history_rows = (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == user.id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )
    history = [{"role": m.role, "content": m.content} for m in history_rows[:-1]]

    context_str = "\n".join(context_parts)
    full_message = f"Context:\n{context_str}\n\nFarmer's question: {payload.message}" if context_str else payload.message

    reply = await chat_completion(SYSTEM_PROMPT, full_message, history)
    if reply is None:
        return {"connected": False, "reason": "AI request failed", "reply": None}

    assistant_msg = models.ChatMessage(user_id=user.id, role="assistant", content=reply)
    db.add(assistant_msg)
    db.commit()

    return {"connected": True, "reason": None, "reply": reply}
