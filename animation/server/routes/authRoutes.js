import express from "express";
import passport from "passport";
import {
  checkHome,
  logoutUser,   
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

router.get("/home", checkHome);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/auth/google/home",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
  }),
  (req, res) => {
    res.redirect("http://localhost:5173/home");
  },
);

export default router;
