const botoes = document.querySelectorAll("button");

botoes.forEach(botao => {

    botao.addEventListener("mouseenter", () => {
        botao.style.transform = "scale(1.05)";
        botao.style.transition = "0.3s";
    });

    botao.addEventListener("mouseleave", () => {
        botao.style.transform = "scale(1)";
    });

});