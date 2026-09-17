import http from "http";
import { Server as SocketIOServer } from "socket.io";
import express from "express";
import env from "dotenv";
import cors from "cors";
import fs from "fs";
import swaggerUi from "swagger-ui-express";

import "./config/db.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startDueTaskScheduler } from "./utils/dueTaskScheduler.js";
import { ensureBucketExists } from "./config/minio.js";

env.config();

const app = express();
const port = process.env.PORT || 3000;

// Enable proxy trust for Render / Railway / Heroku
app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://task-managment-app-frontend-nu.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:3000",
].filter(Boolean);

// CORS origin validator (supports local, configured URL, and Vercel preview URLs)
const corsOriginChecker = (origin, callback) => {
  if (
    !origin ||
    allowedOrigins.includes(origin) ||
    /\.vercel\.app$/.test(origin) ||
    process.env.NODE_ENV !== "production"
  ) {
    callback(null, true);
  } else {
    callback(new Error(`CORS blocked for origin: ${origin}`));
  }
};

const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: corsOriginChecker,
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

// Middleware
app.use(
  cors({
    origin: corsOriginChecker,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Swagger Docs (Safe loading to avoid crashing if file is missing)
if (fs.existsSync("./swagger-output.json")) {
  try {
    const swaggerDocument = JSON.parse(
      fs.readFileSync("./swagger-output.json", "utf8"),
    );
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  } catch (err) {
    console.warn("Could not load swagger-output.json:", err.message);
  }
}

// Routes
app.use("/", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/tasks", commentRoutes);
app.use("/users", userRoutes);
app.use("/notifications", notificationRoutes);

// Server start
server.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  try {
    await ensureBucketExists();
  } catch (err) {
    console.error("MinIO bucket initialization failed:", err.message);
  }
  startDueTaskScheduler(io);
});