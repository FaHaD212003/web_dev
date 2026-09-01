import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import db from "../config/db.js";

const saltRounds = 10;

export const checkHome = (req, res) => {
  if (req.user) {
    return res.status(200).json({
      authenticated: true,
      user: req.user,
    });
  } else {
    return res.status(401).json({
      authenticated: false,
      message: "Not authenticated",
    });
  }
};

export const logoutUser = (req, res) => {
  return res.status(200).json({
    message: "Logged out successfully. Please clear token on the client.",
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
      return res.status(401).json({ message: "Invalid email." });
    }

    const user = result.rows[0];

    if (user.is_revoked) {
      return res
        .status(403)
        .json({ message: "Your account has been revoked." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_revoked: user.is_revoked,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
export const registerUser = async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  const role = req.body.role || "user";

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "User already exists. Please log in." });
    }

    const hash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
      [email, hash, role],
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(201).json({
      message: "Registration successful",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_revoked: user.is_revoked,
      },
    });
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

    const user = userResult.rows[0];

    const token = jwt.sign(
      { id: user.id, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    await db.query(
      "UPDATE users SET reset_password_token = $1 WHERE email = $2",
      [token, email],
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      "SELECT * FROM users WHERE id = $1 AND reset_password_token = $2",
      [decoded.id, token],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Token has already been used or is invalid." });
    }

    const user = result.rows[0];
    const hash = await bcrypt.hash(newPassword, saltRounds);

    await db.query(
      "UPDATE users SET password = $1, reset_password_token = NULL WHERE email = $2",
      [hash, user.email],
    );

    return res.status(200).json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res
      .status(400)
      .json({ message: "Password reset token is invalid or has expired." });
  }
};
