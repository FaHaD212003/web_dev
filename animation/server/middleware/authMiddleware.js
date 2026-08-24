import jwt from "jsonwebtoken";
import env from "dotenv";

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

    req.user = decodedUser;
    next();
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
 