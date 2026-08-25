import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import env from "dotenv";
import cors from "cors";
import "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import { verifyToken } from "./middleware/authMiddleware.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";

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

app.use(express.static("public"));

app.use("/", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
