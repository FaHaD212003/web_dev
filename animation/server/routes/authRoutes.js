import express from "express";
import passport from "passport";
import {
  checkHome,
  logoutUser,
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  sendGoogleVerificationEmail,
  verifyGoogleUser,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/home", verifyToken, checkHome);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/logout", logoutUser);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post("/send-google-verify", verifyToken, sendGoogleVerificationEmail);
router.post(
  "/auth/send-google-verify",
  verifyToken,
  sendGoogleVerificationEmail,
);
router.post("/verify-google-token", verifyGoogleUser);
router.post("/auth/verify-google-token", verifyGoogleUser);

import jwt from "jsonwebtoken";

router.get(
  ["/google", "/auth/google"],
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/tasks.readonly",
      "https://www.googleapis.com/auth/tasks",
    ],
    accessType: "offline",
    prompt: "consent",
    session: false,
  }),
);

router.get(
  ["/google/home", "/auth/google/home"],
  (req, res, next) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    passport.authenticate("google", {
      failureRedirect: `${clientUrl}/login?error=google_auth_failed`,
      session: false,
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        is_google_user: true,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    const userData = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_google_user: true,
        is_revoked: user.is_revoked,
      }),
    );

    res.redirect(
      `${clientUrl}/calendar?token=${token}&user=${userData}&google_connected=true`,
    );
  },
);

export default router;
