import db from "../config/db.js";

export const getEmployees = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, email FROM users WHERE role = 'user'",
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch roster." });
  }
};
