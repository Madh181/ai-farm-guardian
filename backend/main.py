import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
import models
from routers import (
    auth_router,
    farms_router,
    fields_router,
    scans_router,
    priority_router,
    rescue_router,
    weather_router,
    economic_router,
    chat_router,
    treatments_router,
    notifications_router,
    dashboard_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Farm Guardian API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_router.router)
app.include_router(farms_router.router)
app.include_router(fields_router.router)
app.include_router(scans_router.router)
app.include_router(priority_router.router)
app.include_router(rescue_router.router)
app.include_router(weather_router.router)
app.include_router(economic_router.router)
app.include_router(chat_router.router)
app.include_router(treatments_router.router)
app.include_router(notifications_router.router)
app.include_router(dashboard_router.router)

@app.get("/")
def root():
    return {"message": "AI Farm Guardian API running"}
