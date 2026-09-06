from app import db
from datetime import datetime


class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    doctor_name = db.Column(db.String(120), nullable=False)
    specialty = db.Column(db.String(100))

    appointment_date = db.Column(db.Date, nullable=False)
    appointment_time = db.Column(db.String(40))

    status = db.Column(db.String(20), default="Booked")

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
