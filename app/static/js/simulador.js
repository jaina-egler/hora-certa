document.addEventListener("DOMContentLoaded", function () {
    iniciarPopovers();
    configurarPesquisaTabela();
    configurarCalculadora();
    configurarFormularioContato();
});


/* =========================================================
   Popovers
========================================================= */

function iniciarPopovers() {
    const elementos = document.querySelectorAll('[data-bs-toggle="popover"]');

    elementos.forEach(function (elemento) {
        new bootstrap.Popover(elemento);
    });
}


/* =========================================================
   Pesquisa da tabela
========================================================= */

function configurarPesquisaTabela() {
    const campoPesquisa = document.getElementById("pesquisaTabela");
    const botaoLimpar = document.getElementById("limparPesquisa");
    const tabela = document.getElementById("tabelaAtividades");
    const mensagemVazia = document.getElementById("mensagemTabelaVazia");

    if (!campoPesquisa || !tabela) {
        return;
    }

    const linhas = Array.from(tabela.querySelectorAll("tbody tr"));

    campoPesquisa.addEventListener("input", function () {
        filtrarTabela(campoPesquisa.value, linhas, mensagemVazia);
    });

    if (botaoLimpar) {
        botaoLimpar.addEventListener("click", function () {
            campoPesquisa.value = "";
            filtrarTabela("", linhas, mensagemVazia);
            campoPesquisa.focus();
        });
    }
}


function normalizarTexto(texto) {
    return texto
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}


function filtrarTabela(termo, linhas, mensagemVazia) {
    const pesquisa = normalizarTexto(termo);
    let totalVisivel = 0;

    linhas.forEach(function (linha) {
        const textoLinha = normalizarTexto(linha.innerText);
        const encontrou = textoLinha.includes(pesquisa);

        linha.classList.toggle("d-none", !encontrou);

        if (encontrou) {
            totalVisivel += 1;
        }
    });

    if (mensagemVazia) {
        mensagemVazia.classList.toggle("d-none", totalVisivel > 0);
    }
}


/* =========================================================
   Calculadora
========================================================= */

const REGRAS_CATEGORIAS = {
    curso: {
        nome: "Curso complementar",
        limite: 60,
        calcular: function (carga) {
            if (carga <= 0) return 0;
            if (carga <= 10) return 5;
            if (carga <= 30) return 15;
            return 20;
        },
        explicar: function (carga, base) {
            return `Curso com ${formatarHoras(carga)}. Pela regra, pode contar até ${formatarHoras(base)}.`;
        }
    },

    evento_regional_nacional: {
        nome: "Evento regional ou nacional",
        limite: 10,
        calcular: function () {
            return 2;
        },
        explicar: function () {
            return "Participação em evento regional ou nacional conta 2h por atividade.";
        }
    },

    evento_internacional: {
        nome: "Evento internacional",
        limite: 15,
        calcular: function () {
            return 3;
        },
        explicar: function () {
            return "Participação em evento internacional conta 3h por atividade.";
        }
    },

    software_sem_registro: {
        nome: "Software sem registro",
        limite: 40,
        calcular: function () {
            return 20;
        },
        explicar: function () {
            return "Produção de software sem registro pode contar 20h por produto.";
        }
    },

    software_com_registro: {
        nome: "Software com registro",
        limite: 80,
        calcular: function () {
            return 40;
        },
        explicar: function () {
            return "Produção de software com registro pode contar 40h por produto.";
        }
    },

    doacao_sangue: {
        nome: "Doação de sangue",
        limite: 30,
        calcular: function () {
            return 5;
        },
        explicar: function () {
            return "Cada doação de sangue pode contar 5h.";
        }
    },

    voluntariado: {
        nome: "Voluntariado",
        limite: 40,
        calcular: function (carga) {
            if (carga <= 0) return 0;
            if (carga <= 10) return 5;
            if (carga <= 30) return 8;
            return 10;
        },
        explicar: function (carga, base) {
            return `Voluntariado com ${formatarHoras(carga)}. Pela regra, pode contar até ${formatarHoras(base)}.`;
        }
    },

    tre: {
        nome: "Serviço eleitoral",
        limite: 24,
        calcular: function () {
            return 8;
        },
        explicar: function () {
            return "Serviço eleitoral ao TRE pode contar 8h por atividade.";
        }
    }
};

const STORAGE_CHAVE = "horacerta_ifro_calculadora_suap";

let atividadesSimuladas = [];


function configurarCalculadora() {
    carregarDadosSalvos();

    const btnAdicionar = document.getElementById("btnAdicionarAtividade");
    const btnLimpar = document.getElementById("btnLimparSimulacao");

    ["cargaCurso", "horasDeferidas"].forEach(function (id) {
        const campo = document.getElementById(id);

        if (campo) {
            campo.addEventListener("input", function () {
                salvarDados();
                atualizarResumo();
            });
        }
    });

    if (btnAdicionar) {
        btnAdicionar.addEventListener("click", adicionarAtividade);
    }

    if (btnLimpar) {
        btnLimpar.addEventListener("click", limparSimulacao);
    }

    atualizarResumo();
}


function adicionarAtividade() {
    const categoria = obterValor("tipoAtividade");
    const cargaCertificado = obterNumero("cargaCertificado");
    const horasCategoria = obterNumero("horasCategoria");

    if (!categoria) {
        mostrarMensagem("Selecione a categoria da atividade.", "erro");
        return;
    }

    const regra = REGRAS_CATEGORIAS[categoria];

    if (!regra) {
        mostrarMensagem("Categoria não encontrada.", "erro");
        return;
    }

    if (categoriaExigeCarga(categoria) && cargaCertificado <= 0) {
        mostrarMensagem("Informe a carga horária do certificado.", "erro");
        return;
    }

    const jaSimuladoNaCategoria = somarHorasSimuladasPorCategoria(categoria);
    const disponivelNaCategoria = Math.max(regra.limite - horasCategoria - jaSimuladoNaCategoria, 0);

    const horasBase = regra.calcular(cargaCertificado);
    const horasEstimadas = Math.min(horasBase, disponivelNaCategoria);

    let observacao = regra.explicar(cargaCertificado, horasBase);

    if (disponivelNaCategoria <= 0) {
        observacao = `Essa categoria já atingiu o limite de ${formatarHoras(regra.limite)}.`;
    } else if (horasEstimadas < horasBase) {
        observacao = `A atividade poderia contar ${formatarHoras(horasBase)}, mas restam apenas ${formatarHoras(disponivelNaCategoria)} nessa categoria.`;
    }

    atividadesSimuladas.push({
        categoria: categoria,
        categoriaNome: regra.nome,
        cargaCertificado: cargaCertificado,
        horasCategoria: horasCategoria,
        horasEstimadas: horasEstimadas,
        limiteCategoria: regra.limite,
        observacao: observacao
    });

    limparCamposAtividade();
    salvarDados();
    atualizarResumo();

    mostrarMensagem(`Atividade adicionada. Aproveitamento estimado: ${formatarHoras(horasEstimadas)}.`, "sucesso");
}


function categoriaExigeCarga(categoria) {
    return categoria === "curso" || categoria === "voluntariado";
}


function limparCamposAtividade() {
    const tipoAtividade = document.getElementById("tipoAtividade");
    const cargaCertificado = document.getElementById("cargaCertificado");

    if (tipoAtividade) {
        tipoAtividade.value = "";
    }

    if (cargaCertificado) {
        cargaCertificado.value = "";
    }

    /*
      O campo horasCategoria fica preenchido.
      Assim, se o aluno for lançar várias atividades da mesma categoria,
      ele não precisa digitar de novo.
    */
}


function limparSimulacao() {
    atividadesSimuladas = [];
    salvarDados();
    atualizarResumo();
    mostrarMensagem("Simulação limpa.", "info");
}


function removerAtividade(indice) {
    atividadesSimuladas.splice(indice, 1);
    salvarDados();
    atualizarResumo();
    mostrarMensagem("Atividade removida.", "info");
}

window.removerAtividade = removerAtividade;


function atualizarResumo() {
    const cargaCurso = obterNumero("cargaCurso");
    const horasDeferidas = obterNumero("horasDeferidas");

    const horasSimuladas = atividadesSimuladas.reduce(function (total, item) {
        return total + item.horasEstimadas;
    }, 0);

    const totalEstimado = horasDeferidas + horasSimuladas;
    const horasFaltantes = Math.max(cargaCurso - totalEstimado, 0);

    escreverTexto("horasSimuladas", formatarHoras(horasSimuladas));
    escreverTexto("totalEstimado", formatarHoras(totalEstimado));
    escreverTexto("horasFaltantes", formatarHoras(horasFaltantes));

    renderizarTabelaSimulacao();

    if (cargaCurso > 0) {
        mostrarMensagem(
            `Com as atividades simuladas, você chegaria a ${formatarHoras(totalEstimado)} de ${formatarHoras(cargaCurso)}. Ainda faltariam ${formatarHoras(horasFaltantes)}.`,
            "info"
        );
    }

    salvarDados();
}


function renderizarTabelaSimulacao() {
    const tbody = document.getElementById("listaAtividadesSimuladas");

    if (!tbody) {
        return;
    }

    const linhaFormulario = `
        <tr class="add-row">
            <td>
                <select class="form-select form-select-sm" id="tipoAtividade">
                    <option value="">Selecione...</option>
                    <option value="curso">Curso complementar</option>
                    <option value="evento_regional_nacional">Evento regional ou nacional</option>
                    <option value="evento_internacional">Evento internacional</option>
                    <option value="software_sem_registro">Software sem registro</option>
                    <option value="software_com_registro">Software com registro</option>
                    <option value="doacao_sangue">Doação de sangue</option>
                    <option value="voluntariado">Voluntariado</option>
                    <option value="tre">Serviço eleitoral</option>
                </select>
            </td>

            <td>
                <input
                    type="number"
                    class="form-control form-control-sm"
                    id="cargaCertificado"
                    placeholder="Ex: 40"
                    min="0"
                    step="0.5"
                >
            </td>

            <td>
                <input
                    type="number"
                    class="form-control form-control-sm"
                    id="horasCategoria"
                    placeholder="Ex: 47"
                    min="0"
                    step="0.5"
                >
            </td>

            <td colspan="2" class="add-row-help">
                Informe os dados da atividade para simular.
            </td>

            <td>
                <button
                    type="button"
                    class="btn btn-success btn-sm w-100"
                    id="btnAdicionarAtividade"
                >
                    Adicionar
                </button>
            </td>
        </tr>
    `;

    const linhasAtividades = atividadesSimuladas.map(function (item, indice) {
        return `
            <tr>
                <td>${item.categoriaNome}</td>
                <td>${formatarHoras(item.cargaCertificado)}</td>
                <td>${formatarHoras(item.horasCategoria)}</td>
                <td><strong>${formatarHoras(item.horasEstimadas)}</strong></td>
                <td>${item.observacao}</td>
                <td>
                    <button
                        type="button"
                        class="suap-remove-button"
                        onclick="removerAtividade(${indice})"
                    >
                        Remover
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    const linhaVazia = atividadesSimuladas.length === 0
        ? `
            <tr id="linhaVaziaSimulacao">
                <td colspan="6" class="empty-row">
                    Nenhuma atividade adicionada ainda.
                </td>
            </tr>
        `
        : "";

    tbody.innerHTML = linhaFormulario + linhasAtividades + linhaVazia;

    const novoBotao = document.getElementById("btnAdicionarAtividade");

    if (novoBotao) {
        novoBotao.addEventListener("click", adicionarAtividade);
    }
}


function somarHorasSimuladasPorCategoria(categoria) {
    return atividadesSimuladas
        .filter(function (item) {
            return item.categoria === categoria;
        })
        .reduce(function (total, item) {
            return total + item.horasEstimadas;
        }, 0);
}


function mostrarMensagem(texto, tipo) {
    const resultado = document.getElementById("resultadoSimulacao");

    if (!resultado) {
        return;
    }

    let classe = "result-info";

    if (tipo === "erro") {
        classe = "result-error";
    }

    if (tipo === "sucesso") {
        classe = "result-success";
    }

    resultado.innerHTML = `<div class="${classe}">${texto}</div>`;
}


function obterValor(id) {
    const elemento = document.getElementById(id);
    return elemento ? elemento.value : "";
}


function obterNumero(id) {
    const elemento = document.getElementById(id);

    if (!elemento) {
        return 0;
    }

    const valor = Number(elemento.value);

    return Number.isNaN(valor) ? 0 : valor;
}


function escreverTexto(id, texto) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.innerText = texto;
    }
}


function formatarHoras(valor) {
    const numero = Number(valor || 0);

    if (Number.isInteger(numero)) {
        return `${numero}h`;
    }

    return `${numero.toFixed(1).replace(".", ",")}h`;
}


function salvarDados() {
    const dados = {
        cargaCurso: obterValor("cargaCurso"),
        horasDeferidas: obterValor("horasDeferidas"),
        atividadesSimuladas: atividadesSimuladas
    };

    localStorage.setItem(STORAGE_CHAVE, JSON.stringify(dados));
}


function carregarDadosSalvos() {
    const dadosSalvos = localStorage.getItem(STORAGE_CHAVE);

    if (!dadosSalvos) {
        return;
    }

    try {
        const dados = JSON.parse(dadosSalvos);

        const cargaCurso = document.getElementById("cargaCurso");
        const horasDeferidas = document.getElementById("horasDeferidas");

        if (cargaCurso && dados.cargaCurso) {
            cargaCurso.value = dados.cargaCurso;
        }

        if (horasDeferidas && dados.horasDeferidas) {
            horasDeferidas.value = dados.horasDeferidas;
        }

        atividadesSimuladas = Array.isArray(dados.atividadesSimuladas)
            ? dados.atividadesSimuladas
            : [];
    } catch (erro) {
        localStorage.removeItem(STORAGE_CHAVE);
        atividadesSimuladas = [];
    }
}
/* =========================================================
   Formulário de contato
========================================================= */

function configurarFormularioContato() {
    const formulario = document.getElementById("formContato");
    const feedback = document.getElementById("feedbackContato");
    const botao = document.getElementById("btnEnviarContato");

    if (!formulario || !feedback || !botao) {
        return;
    }

    formulario.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const dados = {
            nome: document.getElementById("nome").value.trim(),
            email: document.getElementById("email").value.trim(),
            tipo: document.getElementById("tipoMensagem").value,
            mensagem: document.getElementById("mensagem").value.trim()
        };

        if (!dados.nome || !dados.email || !dados.mensagem) {
            mostrarFeedbackContato(
                "Preencha nome, e-mail e mensagem antes de enviar.",
                "erro"
            );
            return;
        }

        botao.disabled = true;
        botao.innerText = "Enviando...";

        try {
            const resposta = await fetch("/contato", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.ok) {
                mostrarFeedbackContato(
                    resultado.mensagem || "Não foi possível enviar a mensagem.",
                    "erro"
                );
                return;
            }

            mostrarFeedbackContato(resultado.mensagem, "sucesso");
            formulario.reset();

        } catch (erro) {
            mostrarFeedbackContato(
                "Erro ao enviar mensagem. Tente novamente mais tarde.",
                "erro"
            );
        } finally {
            botao.disabled = false;
            botao.innerText = "Enviar mensagem";
        }
    });
}


function mostrarFeedbackContato(mensagem, tipo) {
    const feedback = document.getElementById("feedbackContato");

    if (!feedback) {
        return;
    }

    feedback.classList.remove(
        "d-none",
        "contact-feedback-success",
        "contact-feedback-error"
    );

    if (tipo === "sucesso") {
        feedback.classList.add("contact-feedback-success");
    } else {
        feedback.classList.add("contact-feedback-error");
    }

    feedback.innerText = mensagem;
}