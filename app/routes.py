"""
Rotas principais da aplicação.
"""

from flask import Blueprint, render_template

from app.regras import ATIVIDADES_COMPLEMENTARES

main = Blueprint("main", __name__)


@main.route("/")
def index():
    """
    Renderiza a página inicial do sistema.

    Returns:
        str: template HTML renderizado.
    """
    return render_template(
        "index.html",
        atividades=ATIVIDADES_COMPLEMENTARES
    )