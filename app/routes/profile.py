import os
import uuid

from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    flash,
    current_app,
    request,
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
    form = SettingsForm(obj=current_user)
    form.name.data = current_user.name
    form.phone.data = current_user.phone
    form.bio.data = current_user.bio
    form.language.data = current_user.language or "en"

    open_edit = request.args.get("edit") == "1"

    return render_template("profile/view.html", form=form, open_edit=open_edit)


@profile_bp.route("/settings", methods=["GET", "POST"])
@login_required
def settings():

    # Settings no longer has its own page — it's an edit toggle on
    # /profile now. A GET here (e.g. an old bookmark) just goes there.
    if request.method == "GET":
        return redirect(url_for("profile.view_profile"))

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
        return redirect(url_for("profile.view_profile"))

    # Validation failed — field-level errors don't survive a redirect,
    # so flash a general message and reopen the edit panel so the user
    # can see and retry the form.
    flash("Please correct the errors below.", "danger")
    return redirect(url_for("profile.view_profile", edit="1"))
