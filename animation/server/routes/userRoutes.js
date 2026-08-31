import express from "express";
import { getEmployees } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; 
import { getDashboardStats } from "../controllers/userController.js";

const router = express.Router();

router.get("/employees", verifyToken, getEmployees);
router.get("/dashboard-stats", verifyToken, getDashboardStats);
export default router;