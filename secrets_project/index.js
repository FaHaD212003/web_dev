//To see how the final website should work, run "node solution.js".
//Make sure you have installed all the dependencies with "npm i".
//The password is ILoveProgramming
import express from "express";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
import bodyParser from "body-parser";

const app = express();
const port = 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
app.use(bodyParser.urlencoded({ extended: true }));
let correct = false;


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
let checkPassword = (req, res, next) => {
    let password = String(req.body.password);
    
    if (password === "ILoveProgramming") {
        return correct = true;
    } else {
       return  correct = false;
    }
    next();
};
app.use(checkPassword);
app.post("/check", (req, res) => {
    if (correct) {
        res.sendFile(__dirname + "/public/secret.html");
    }
    else {
        res.redirect("/");
    }
  
});