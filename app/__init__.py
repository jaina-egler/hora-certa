"""
Inicialização da aplicação Flask.
"""

import os

from dotenv import load_dotenv
from flask import Flask


def create_app():
    """
    Cria e configura a aplicação Flask.

    Returns:
        Flask: instância configurada da aplicação.
    """
    load_dotenv()

    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get(
        "SECRET_KEY",
        "chave-dev-horacerta-ifro"
    )

    app.config["EMAIL_HOST"] = os.environ.get("EMAIL_HOST", "")
    app.config["EMAIL_PORT"] = int(os.environ.get("EMAIL_PORT", "465"))
    app.config["EMAIL_USE_SSL"] = os.environ.get("EMAIL_USE_SSL", "true").lower() == "true"
    app.config["EMAIL_USER"] = os.environ.get("EMAIL_USER", "")
    app.config["EMAIL_PASSWORD"] = os.environ.get("EMAIL_PASSWORD", "")
    app.config["EMAIL_TO"] = os.environ.get("EMAIL_TO", "")
    app.config["EMAIL_TIMEOUT"] = int(os.environ.get("EMAIL_TIMEOUT", "10"))
    app.config["EMAIL_ENABLED"] = os.environ.get("EMAIL_ENABLED", "true").lower() == "true"

    from app.routes import main
    app.register_blueprint(main)

    return app