import express from "express";
import {
  getAllTasks,
  getMyTasks,
  getAssignedTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-tasks", verifyToken, getMyTasks);
router.get("/assigned-tasks", verifyToken, getAssignedTasks);
router.get("/task-detail/:id", verifyToken, getTaskById);
router.get("/:id", verifyToken, getTaskById);
router.get("/", verifyToken, getAllTasks);
router.post("/", verifyToken, createTask);
router.put("/:id", verifyToken, updateTask);
router.delete("/:id", verifyToken, deleteTask);

export default router;
