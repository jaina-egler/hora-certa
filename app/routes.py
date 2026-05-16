"""
Rotas principais da aplicação HoraCerta IFRO.
"""

import csv
import smtplib
from datetime import datetime
from email.message import EmailMessage
from pathlib import Path

from flask import Blueprint, current_app, jsonify, render_template, request

from app.regras import ATIVIDADES_COMPLEMENTARES

main = Blueprint("main", __name__)


@main.route("/")
def index():
    """
    Renderiza a página inicial do sistema.
    """
    return render_template(
        "index.html",
        atividades=ATIVIDADES_COMPLEMENTARES
    )


@main.post("/contato")
def receber_contato():
    """
    Recebe mensagens enviadas pelo formulário de contato.

    A mensagem é salva em CSV e enviada por e-mail.
    """
    dados = request.get_json(silent=True) or request.form

    nome = limpar_texto(dados.get("nome"))
    email = limpar_texto(dados.get("email"))
    tipo = limpar_texto(dados.get("tipo"))
    mensagem = limpar_texto(dados.get("mensagem"))

    if not nome or not email or not mensagem:
        return jsonify({
            "ok": False,
            "mensagem": "Preencha nome, e-mail e mensagem antes de enviar."
        }), 400

    if len(nome) > 120:
        return jsonify({
            "ok": False,
            "mensagem": "O nome informado está muito grande."
        }), 400

    if len(email) > 160:
        return jsonify({
            "ok": False,
            "mensagem": "O e-mail informado está muito grande."
        }), 400

    if len(mensagem) > 2000:
        return jsonify({
            "ok": False,
            "mensagem": "A mensagem deve ter no máximo 2000 caracteres."
        }), 400

    data_hora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    salvar_contato_csv(
        data_hora=data_hora,
        nome=nome,
        email=email,
        tipo=tipo or "Não informado",
        mensagem=mensagem
    )

    try:
        enviar_email_contato(
            data_hora=data_hora,
            nome=nome,
            email=email,
            tipo=tipo or "Não informado",
            mensagem=mensagem
        )
    except Exception as erro:
        current_app.logger.error(
            "Erro ao enviar e-mail de contato: %s",
            erro,
            exc_info=True
        )

        return jsonify({
            "ok": True,
            "mensagem": (
                "Mensagem salva com sucesso, mas não foi possível enviar o e-mail agora. "
                "A sugestão ficou registrada no sistema."
            )
        })

    return jsonify({
        "ok": True,
        "mensagem": "Mensagem enviada com sucesso. Obrigada pela contribuição!"
    })


def salvar_contato_csv(data_hora, nome, email, tipo, mensagem):
    """
    Salva a mensagem de contato em CSV.
    """
    caminho_csv = obter_caminho_contatos()
    arquivo_existe = caminho_csv.exists()

    with caminho_csv.open("a", newline="", encoding="utf-8") as arquivo:
        campos = ["data_hora", "nome", "email", "tipo", "mensagem"]

        escritor = csv.DictWriter(
            arquivo,
            fieldnames=campos,
            delimiter=";"
        )

        if not arquivo_existe:
            escritor.writeheader()

        escritor.writerow({
            "data_hora": data_hora,
            "nome": nome,
            "email": email,
            "tipo": tipo,
            "mensagem": mensagem
        })


def enviar_email_contato(data_hora, nome, email, tipo, mensagem):
    """
    Envia a mensagem de contato por e-mail usando SMTP.
    """
    host = current_app.config["EMAIL_HOST"]
    port = current_app.config["EMAIL_PORT"]
    use_ssl = current_app.config["EMAIL_USE_SSL"]
    usuario = current_app.config["EMAIL_USER"]
    senha = current_app.config["EMAIL_PASSWORD"]
    destinatario = current_app.config["EMAIL_TO"]

    if not host or not usuario or not senha or not destinatario:
        raise RuntimeError("Configurações de e-mail não foram preenchidas no .env.")

    assunto = f"[HoraCerta IFRO] Nova mensagem: {tipo}"

    corpo = f"""
Nova mensagem recebida pelo HoraCerta IFRO.

Data/hora: {data_hora}
Nome: {nome}
E-mail: {email}
Tipo: {tipo}

Mensagem:
{mensagem}
""".strip()

    email_msg = EmailMessage()
    email_msg["Subject"] = assunto
    email_msg["From"] = usuario
    email_msg["To"] = destinatario
    email_msg["Reply-To"] = email
    email_msg.set_content(corpo)

    if use_ssl:
        with smtplib.SMTP_SSL(host, port) as servidor:
            servidor.login(usuario, senha)
            servidor.send_message(email_msg)
    else:
        with smtplib.SMTP(host, port) as servidor:
            servidor.starttls()
            servidor.login(usuario, senha)
            servidor.send_message(email_msg)


def obter_caminho_contatos():
    """
    Retorna o caminho do arquivo CSV onde os contatos serão salvos.
    """
    pasta_raiz = Path(current_app.root_path).parent
    pasta_data = pasta_raiz / "data"

    pasta_data.mkdir(exist_ok=True)

    return pasta_data / "contatos.csv"


def limpar_texto(valor):
    """
    Limpa valores recebidos do formulário.
    """
    if valor is None:
        return ""

    return str(valor).strip()