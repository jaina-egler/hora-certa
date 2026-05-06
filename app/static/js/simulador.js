/**
 * Arquivo reservado para as regras do simulador.
 *
 * Nesta primeira etapa, o botão apenas apresenta uma mensagem inicial.
 * A lógica de cálculo será implementada na próxima etapa do projeto.
 */

document.addEventListener("DOMContentLoaded", function () {
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
});