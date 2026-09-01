import express from "express";
import {
  getEmployees,
  getDashboardStats,
  searchUsers,
  getUserDetail,
  updateUserAccess,
} from "../controllers/userController.js";
import { verifyToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/employees", verifyToken, getEmployees);
router.get("/dashboard-stats", verifyToken, getDashboardStats);
router.get("/search", verifyToken, searchUsers);
router.get("/:id/details", verifyToken, getUserDetail);
router.patch("/:id/access", verifyToken, requireAdmin, updateUserAccess);
export default router;
