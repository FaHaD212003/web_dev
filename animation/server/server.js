import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import env from "dotenv";
import cors from "cors";
import "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";

env.config();

const app = express();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(express.static("public"));

app.use(passport.initialize());
app.use(passport.session());

app.use("/", authRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
