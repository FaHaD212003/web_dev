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

export const getDashboardStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        u.id, 
        u.email, 
        COUNT(t.id) AS total_tasks 
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.email
      ORDER BY total_tasks DESC;
    `;
    
    const result = await db.query(statsQuery);
    
    // Calculate total users by counting the rows returned
    const totalUsers = result.rows.length;

    res.status(200).json({
      totalUsers,
      userStats: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard stats." });
  }
};
