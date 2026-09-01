import jwt from "jsonwebtoken";
import env from "dotenv";
import db from "../config/db.js";

env.config();

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied: No token provided." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    db.query("SELECT id, email, role, is_revoked FROM users WHERE id = $1", [
      decodedUser.id,
    ])
      .then((result) => {
        if (result.rows.length === 0) {
          return res.status(403).json({ message: "User no longer exists." });
        }

        const currentUser = result.rows[0];

        if (currentUser.is_revoked) {
          return res
            .status(403)
            .json({ message: "Your account has been revoked." });
        }

        req.user = {
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role,
        };
        next();
      })
      .catch(() => {
        return res
          .status(500)
          .json({ message: "Failed to validate user access." });
      });
  });
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access Denied: Admin privileges required." });
  }
};
