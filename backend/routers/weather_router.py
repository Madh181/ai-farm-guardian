from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
import models
from auth import get_current_user
from services.weather_service import get_weather, OPENWEATHER_API_KEY

router = APIRouter(prefix="/api/weather", tags=["weather"])


@router.get("")
async def weather_for_farm(farm_id: int = Query(...), db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    farm = db.query(models.Farm).filter(models.Farm.id == farm_id, models.Farm.owner_id == user.id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if not OPENWEATHER_API_KEY:
        return {"connected": False, "reason": "OPENWEATHER_API_KEY not configured", "data": None}

    if not farm.latitude or not farm.longitude:
        return {"connected": False, "reason": "Farm has no location set", "data": None}

    data = await get_weather(farm.latitude, farm.longitude)
    if data is None:
        return {"connected": False, "reason": "Weather API request failed", "data": None}

    insights = []
    if data["rain_probability"] >= 50:
        insights.append("Rain expected soon — avoid pesticide spraying today.")
    if data["humidity"] >= 75:
        insights.append("High humidity — fungal disease risk is elevated.")
    if data["temperature"] >= 33:
        insights.append("High temperature detected — monitor irrigation closely.")
    if not insights:
        insights.append("Conditions are currently stable for routine field work.")

    return {"connected": True, "reason": None, "data": data, "insights": insights}
