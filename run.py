"""
Arquivo principal de execução da aplicação.

Projeto: Sistema web para orientação e simulação de Atividades Complementares.
"""

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)