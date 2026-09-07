import express from "express";
import {
  getCommentsByTaskId,
  createComment,
  updateComment,
  deleteComment,
  serveAttachment,
} from "../controllers/commentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router({ mergeParams: true });

// Attachment serving route
router.get("/comments/attachment/:fileKey", serveAttachment);

// Comment routes for tasks
router.get("/:taskId/comments", verifyToken, getCommentsByTaskId);
router.post(
  "/:taskId/comments",
  verifyToken,
  upload.single("file"),
  createComment,
);
router.put("/:taskId/comments/:commentId", verifyToken, updateComment);
router.delete("/:taskId/comments/:commentId", verifyToken, deleteComment);

export default router;
