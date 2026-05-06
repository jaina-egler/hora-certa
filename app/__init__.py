"""
Inicialização da aplicação Flask.

Este arquivo centraliza a criação da aplicação e o registro das rotas.
"""

from flask import Flask


def create_app():
    """
    Cria e configura a aplicação Flask.

    Returns:
        Flask: instância configurada da aplicação.
    """
    app = Flask(__name__)

    from app.routes import main
    app.register_blueprint(main)

    return app