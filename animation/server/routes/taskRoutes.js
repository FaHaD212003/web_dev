import express from "express";
import { 
  getAllTasks, 
  getMyTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-tasks", verifyToken, getMyTasks);
router.get("/", verifyToken, getAllTasks);
router.post("/", verifyToken, createTask);
router.put("/:id", verifyToken, updateTask);
router.delete("/:id", verifyToken, deleteTask);

export default router;