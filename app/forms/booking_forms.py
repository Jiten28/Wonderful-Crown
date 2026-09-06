from flask_wtf import FlaskForm
from wtforms import (
    HiddenField,
    DateField,
    SelectField,
    SubmitField
)
from wtforms.validators import DataRequired


class BookingForm(FlaskForm):

    # Set by the doctor.html modal-trigger JS before submit.
    doctor_name = HiddenField(
        "Doctor",
        validators=[DataRequired()]
    )

    specialty = HiddenField("Specialty")

    appointment_date = DateField(
        "Preferred Date",
        format="%Y-%m-%d",
        validators=[DataRequired()],
        render_kw={"type": "date"}
    )

    appointment_time = SelectField(
        "Preferred Time",
        validators=[DataRequired()],
        choices=[
            ("09:00 AM - 10:00 AM", "09:00 AM - 10:00 AM"),
            ("10:00 AM - 11:00 AM", "10:00 AM - 11:00 AM"),
            ("11:00 AM - 12:00 PM", "11:00 AM - 12:00 PM"),
            ("12:00 PM - 01:00 PM", "12:00 PM - 01:00 PM"),
            ("04:00 PM - 05:00 PM", "04:00 PM - 05:00 PM"),
            ("05:00 PM - 06:00 PM", "05:00 PM - 06:00 PM"),
            ("06:00 PM - 07:00 PM", "06:00 PM - 07:00 PM"),
        ]
    )

    submit = SubmitField("Confirm Booking")
