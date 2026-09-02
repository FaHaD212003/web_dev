import express from "express";
import {
  getCommentsByTaskId,
  createComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/:taskId/comments", verifyToken, getCommentsByTaskId);
router.post("/:taskId/comments", verifyToken, createComment);
router.put("/:taskId/comments/:commentId", verifyToken, updateComment);
router.delete("/:taskId/comments/:commentId", verifyToken, deleteComment);

export default router;
