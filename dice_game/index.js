function rollDice() {
    const randomNumber1 = Math.random();
    const dice1 = Math.floor(randomNumber1 * 6) + 1;
    const randomNumber2 = Math.random();
    const dice2 = Math.floor(randomNumber2 * 6) + 1;
    document.querySelector(".img1").setAttribute("src","images/dice"+dice1+".png");
    document.querySelector(".img2").setAttribute("src","images/dice"+dice2+".png");
    if (dice1 > dice2) {
        document.querySelector("h1").innerText = "Player 1 Wins!";
    } else if (dice2 > dice1) {
        document.querySelector("h1").innerText = "Player 2 Wins!";
    } else {
        document.querySelector("h1").innerText = "It's a Draw!";
    }
}