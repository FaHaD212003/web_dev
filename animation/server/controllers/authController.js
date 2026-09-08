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
    const identifier = req.body.email || req.body.username;
    const password = req.body.password;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [identifier],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or username." });
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
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      message: "Login successful",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_google_user: !!user.is_google_user,
        is_revoked: user.is_revoked,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const registerUser = async (req, res) => {
  const email = req.body.email || req.body.username;
  const username =
    req.body.username && req.body.email
      ? req.body.username.trim()
      : req.body.username
        ? req.body.username.split("@")[0]
        : email
          ? email.split("@")[0]
          : "user";
  const password = req.body.password;
  const role = req.body.role || "user";

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    // Check if email already exists
    const emailCheck = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (emailCheck.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    }

    // Check if username already exists
    if (username) {
      const usernameCheck = await db.query(
        "SELECT * FROM users WHERE username = $1",
        [username],
      );
      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({
          message: "This username is already taken. Please choose another.",
        });
      }
    }

    const hash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      "INSERT INTO users (username, email, password, role, is_google_user) VALUES ($1, $2, $3, $4, FALSE) RETURNING *",
      [username, email, hash, role],
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(201).json({
      message: "Registration successful",
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        is_google_user: !!user.is_google_user,
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

export const sendGoogleVerificationEmail = async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const user = userResult.rows[0];

    if (user.is_google_user) {
      return res.status(200).json({
        message: "Your account is already verified as a Google user.",
        is_google_user: true,
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, purpose: "google_verify" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const verifyURL = `http://localhost:5173/verify-google?token=${token}`;

    const mailOptions = {
      to: userEmail,
      from: process.env.EMAIL_USER,
      subject: "Verify Google Account for Regulate Calendar Sync",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px; background-color: #ffffff; color: #18181b;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            <div style="background-color: #2563eb; color: #ffffff; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; margin-right: 12px; text-align: center; line-height: 36px;">R</div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #09090b;">Regulate Calendar Sync</h2>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
            Hello <strong>${user.username || user.email}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
            You requested to verify your Google Account to enable seamless synchronization with <strong>Google Calendar</strong> for your tasks.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyURL}" style="display: inline-block; background-color: #09090b; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              Verify Google Account
            </a>
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: #71717a;">
            Or copy and paste this link into your browser:<br />
            <a href="${verifyURL}" style="color: #2563eb; word-break: break-all;">${verifyURL}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #f4f4f5; margin: 24px 0;" />
          <p style="font-size: 11px; color: #a1a1aa; text-align: center; margin: 0;">
            If you did not request this verification, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({
      message: "Verification email sent successfully. Please check your inbox.",
    });
  } catch (err) {
    console.error("Send Google verification email error:", err);
    return res
      .status(500)
      .json({ message: "Failed to send verification email." });
  }
};

export const verifyGoogleUser = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Verification token is required." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "google_verify") {
      return res
        .status(400)
        .json({ message: "Invalid verification token purpose." });
    }

    const result = await db.query(
      "UPDATE users SET is_google_user = TRUE WHERE id = $1 RETURNING id, username, email, role, is_google_user",
      [decoded.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const updatedUser = result.rows[0];

    return res.status(200).json({
      message:
        "Google account verified successfully! Google Calendar sync is now enabled.",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        is_google_user: true,
      },
    });
  } catch (err) {
    console.error("Verify Google token error:", err);
    return res
      .status(400)
      .json({ message: "Verification token is invalid or has expired." });
  }
};
