"""
Rotas principais da aplicação.

Nesta primeira etapa, a aplicação possui uma única página com informações
sobre Atividades Complementares e a estrutura inicial do simulador.
"""

from flask import Blueprint, render_template

main = Blueprint("main", __name__)


@main.route("/")
def index():
    """
    Renderiza a página inicial do sistema.

    Returns:
        str: template HTML renderizado.
    """
    return render_template("index.html")