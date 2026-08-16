import os
import uuid

from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    flash,
    current_app,
)
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from app import db
from app.forms.profile_forms import SettingsForm

profile_bp = Blueprint("profile", __name__)

UPLOAD_SUBDIR = os.path.join("uploads", "avatars")


@profile_bp.route("/profile")
@login_required
def view_profile():
    return render_template("profile/view.html")


@profile_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():

    form = SettingsForm(obj=current_user)

    if form.validate_on_submit():

        current_user.name = form.name.data
        current_user.phone = form.phone.data
        current_user.bio = form.bio.data
        current_user.language = form.language.data

        # Handle photo upload
        photo_file = form.photo.data
        if photo_file and getattr(photo_file, "filename", ""):

            upload_dir = os.path.join(
                current_app.root_path, "static", UPLOAD_SUBDIR
            )
            os.makedirs(upload_dir, exist_ok=True)

            ext = photo_file.filename.rsplit(".", 1)[-1].lower()
            filename = secure_filename(f"user_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}")
            filepath = os.path.join(upload_dir, filename)
            photo_file.save(filepath)

            current_user.profile_photo = f"{UPLOAD_SUBDIR}/{filename}".replace(
                os.sep, "/"
            )

        db.session.commit()

        flash("Your changes have been saved.", "success")
        return redirect(url_for("profile.settings"))

    elif form.errors and form.is_submitted():
        flash("Please correct the errors below.", "danger")

    if not form.is_submitted():
        form.name.data = current_user.name
        form.phone.data = current_user.phone
        form.bio.data = current_user.bio
        form.language.data = current_user.language or "en"

    return render_template("profile/settings.html", form=form)
