import http from "http";
import { Server as SocketIOServer } from "socket.io";
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
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startDueTaskScheduler } from "./utils/dueTaskScheduler.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

env.config();

const app = express();
const port = 3000;

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  // Task discussion rooms
  socket.on("task:join", (taskId) => {
    if (taskId) {
      socket.join(`task_${taskId}`);
    }
  });

  socket.on("task:leave", (taskId) => {
    if (taskId) {
      socket.leave(`task_${taskId}`);
    }
  });

  // User-specific notification rooms
  socket.on("user:join", (userId) => {
    if (userId) {
      const room = `user_${userId}`;
      socket.join(room);
      console.log(
        `[Socket] User #${userId} joined room ${room} (Socket ID: ${socket.id})`,
      );
    }
  });

  socket.on("user:leave", (userId) => {
    if (userId) {
      const room = `user_${userId}`;
      socket.leave(room);
      console.log(`[Socket] User #${userId} left room ${room}`);
    }
  });
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const swaggerDocument = JSON.parse(
  fs.readFileSync("./swagger-output.json", "utf8"),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.static("public"));
app.use("/", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/tasks", commentRoutes);
app.use("/users", userRoutes);
app.use("/notifications", notificationRoutes);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  startDueTaskScheduler(io);
});
