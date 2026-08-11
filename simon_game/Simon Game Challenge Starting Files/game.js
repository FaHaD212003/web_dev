let gamePattern = [];
let buttonColours = ["red", "blue", "green", "yellow"];
let randomChosenColour;

const nextSequence = () => {
  let randomNumber = Math.floor(Math.random() * buttonColours.length) + 1;
  return randomNumber;
};

randomChosenColour = buttonColours[nextSequence()];
gamePattern.push(randomChosenColour);

$(`#${randomChosenColour}`).fadeIn(100).fadeOut(100);
