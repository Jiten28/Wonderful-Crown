from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, TextAreaField, SelectField, SubmitField
from wtforms.validators import Optional, Length


class SettingsForm(FlaskForm):

    name = StringField(
        "Full Name",
        validators=[Length(min=3, max=100)]
    )

    phone = StringField(
        "Phone",
        validators=[Optional(), Length(max=30)]
    )

    bio = TextAreaField(
        "Bio",
        validators=[Optional(), Length(max=500)]
    )

    language = SelectField(
        "Language",
        choices=[
            ("en", "English"),
            ("es", "Español"),
            ("fr", "Français"),
            ("hi", "हिन्दी"),
            ("ar", "العربية"),
        ],
        validators=[Optional()]
    )

    photo = FileField(
        "Profile Photo",
        validators=[
            FileAllowed(
                ["jpg", "jpeg", "png", "webp"],
                "Images only (jpg, jpeg, png, webp)."
            )
        ]
    )

    submit = SubmitField("Save Changes")
