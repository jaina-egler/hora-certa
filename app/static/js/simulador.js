/**
 * Scripts da aplicação HoraCerta IFRO.
 *
 * Nesta etapa, este arquivo controla:
 * 1. A mensagem inicial do simulador.
 * 2. A pesquisa na tabela de atividades complementares.
 */

document.addEventListener("DOMContentLoaded", function () {
    configurarSimuladorInicial();
    configurarPesquisaTabela();
});


function configurarSimuladorInicial() {
    const botaoSimular = document.getElementById("btnSimular");
    const resultado = document.getElementById("resultadoSimulacao");

    if (!botaoSimular || !resultado) {
        return;
    }

    botaoSimular.addEventListener("click", function () {
        resultado.innerHTML = `
            <div class="alert alert-info mb-0">
                A estrutura do simulador está pronta. 
                Na próxima etapa, serão implementadas as regras de cálculo conforme a tabela de Atividades Complementares.
            </div>
        `;
    });
}


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