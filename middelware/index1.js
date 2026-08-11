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



app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

const validateEmail = (req, res, next) => {
  const email = req.body.email;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send("Invalid email format");
  }
  next();
};
app.use("/submit", validateEmail);

app.post("/submit", (req, res) => {
  res.send("Form submitted successfully!");
  const email = req.body.email;
  console.log(email);
  const password = req.body.password;
  console.log(password);
});