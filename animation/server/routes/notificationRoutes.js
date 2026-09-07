import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getUserNotifications);
router.patch("/mark-all-read", verifyToken, markAllNotificationsAsRead);
router.delete("/clear-all", verifyToken, clearAllNotifications);
router.patch("/:id/read", verifyToken, markNotificationAsRead);
router.delete("/:id", verifyToken, deleteNotification);

export default router;
