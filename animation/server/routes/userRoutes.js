import express from "express";
import { getEmployees } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js"; 

const router = express.Router();

router.get("/employees", verifyToken, getEmployees);

export default router;