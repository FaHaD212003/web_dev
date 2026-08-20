import bcrypt from "bcrypt";
import crypto from "crypto";
import nodemailer from "nodemailer";
import db from "../config/db.js";

const saltRounds = 10;

export const checkHome = (req, res) => {
  if (req.isAuthenticated()) {
    return res.status(200).json({
      authenticated: true,
      user: { id: req.user.id, email: req.user.email },
    });
  } else {
    return res.status(401).json({
      authenticated: false,
      message: "Not authenticated",
    });
  }
};

export const logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Error during logout" });
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
};

export const loginUser = async (req, res) => {
  try {
    const email = req.body.username;
    const password = req.body.password;

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email ." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error("Session creation error:", err);
        return res.status(500).json({ message: "Session creation failed." });
      }

      return res.status(200).json({
        message: "Login successful",
        user: { id: user.id, email: user.email },
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const registerUser = async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "User already exists. Please log in." });
    } else {
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          return res.status(500).json({ message: "Error securing password." });
        } else {
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash],
          );
          const user = result.rows[0];

          req.login(user, (err) => {
            if (err) {
              console.error("Error creating session:", err);
              return res.status(500).json({
                message:
                  "Registration successful, but session creation failed.",
              });
            }
            return res.status(201).json({
              message: "Registration successful",
              user: { id: user.id, email: user.email },
            });
          });
        }
      });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const forgotPassword = async (req, res) => {
  const email = req.body.username;

  try {
    const userResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userResult.rows.length === 0) {
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    const expireTime = Date.now() + 3600000;

    await db.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE email = $3",
      [token, expireTime, email],
    );

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetURL = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: "Password Reset Request - Regulate",
      text: `You are receiving this because you requested a password reset.\n\n
             Please click on the following link, or paste it into your browser to complete the process:\n\n
             ${resetURL}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ message: "Password reset email sent successfully." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (req, res) => {
  const token = req.params.token;
  const newPassword = req.body.password;
  const currentTime = Date.now();

  try {
    const result = await db.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > $2",
      [token, currentTime],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired." });
    }

    const user = result.rows[0];
    bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing new password:", err);
        return res
          .status(500)
          .json({ message: "Error securing new password." });
      }

      await db.query(
        "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE email = $2",
        [hash, user.email],
      );

      return res
        .status(200)
        .json({ message: "Password updated successfully." });
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
