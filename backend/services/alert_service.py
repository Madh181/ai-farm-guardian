from sqlalchemy.orm import Session
from backend.db.models import Notification

class AlertService:
    def create_notification(self, db: Session, user_id: int, title: str, message: str, category: str = "ALERT"):
        noti = Notification(
            user_id=user_id,
            title=title,
            message=message,
            category=category,
            is_read=False
        )
        db.add(noti)
        db.commit()
        db.refresh(noti)
        return noti

    def get_user_notifications(self, db: Session, user_id: int):
        return db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

    def mark_read(self, db: Session, noti_id: int, user_id: int):
        noti = db.query(Notification).filter(Notification.id == noti_id, Notification.user_id == user_id).first()
        if noti:
            noti.is_read = True
            db.commit()
        return noti

alert_service = AlertService()
