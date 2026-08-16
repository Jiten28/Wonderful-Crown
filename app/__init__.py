from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_bcrypt import Bcrypt

from config import Config

db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()


def create_app():

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    login_manager.login_view = "auth.login"
    login_manager.login_message_category = "info"

    # Register Blueprints
    from app.routes.home import home_bp
    app.register_blueprint(home_bp)

    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.prediction import prediction_bp
    app.register_blueprint(prediction_bp)

    from app.routes.profile import profile_bp
    app.register_blueprint(profile_bp)

    # Create database tables
    with app.app_context():
        from app.models.user import User
        from app.models.prediction_history import PredictionHistory

        db.create_all()

        # Lightweight migration: db.create_all() only creates missing
        # tables, it won't add new columns to a table that already
        # exists (e.g. the pre-existing mediverse.db). Add any columns
        # the current User model expects but the DB table doesn't have.
        from sqlalchemy import inspect, text

        inspector = inspect(db.engine)
        existing_columns = {
            col["name"] for col in inspector.get_columns("user")
        }

        expected_columns = {
            "profile_photo": "VARCHAR(255)",
            "phone": "VARCHAR(30)",
            "bio": "TEXT",
            "language": "VARCHAR(10) DEFAULT 'en'",
        }

        with db.engine.connect() as conn:
            for col_name, col_type in expected_columns.items():
                if col_name not in existing_columns:
                    conn.execute(
                        text(
                            f"ALTER TABLE user ADD COLUMN {col_name} {col_type}"
                        )
                    )
            conn.commit()

    return app
