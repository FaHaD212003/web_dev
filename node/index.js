import inquirer from "inquirer";
import fs from "fs";
import qr from "qr-image";

inquirer
  .prompt([
    {
      message: "Enter the text to generate QR code:",
      name: "text",
    },
  ])
  .then((answers) => {
    console.log(answers);
    const url = answers.text;
    const qr_svg = qr.image(url);
    qr_svg.pipe(fs.createWriteStream("qr.png"));
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });
