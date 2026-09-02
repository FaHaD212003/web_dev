import db from "../config/db.js";
import { sendTaskNotification } from "../utils/sendEmail.js";

export const getAllTasks = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query("SELECT COUNT(*) FROM tasks");
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const result = await db.query(
      "SELECT * FROM tasks ORDER BY created_at DESC NULLS LAST, id DESC LIMIT $1 OFFSET $2",
      [limit, offset],
    );

    res.status(200).json({
      tasks: result.rows,
      page,
      limit,
      total,
      hasMore: offset + result.rows.length < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
};

export const getMyTasks = async (req, res) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query(
      "SELECT COUNT(*) FROM tasks WHERE assignee_id = $1",
      [userId],
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const result = await db.query(
      "SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY created_at DESC NULLS LAST, id DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset],
    );

    res.status(200).json({
      tasks: result.rows,
      page,
      limit,
      total,
      hasMore: offset + result.rows.length < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch your tasks." });
  }
};

export const getAssignedTasks = async (req, res) => {
  const userId = req.user.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  try {
    const countResult = await db.query(
      "SELECT COUNT(*) FROM tasks WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1",
      [userId],
    );
    const total = parseInt(countResult.rows[0]?.count || "0", 10);

    const result = await db.query(
      "SELECT * FROM tasks WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1 ORDER BY created_at DESC NULLS LAST, id DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset],
    );

    res.status(200).json({
      tasks: result.rows,
      page,
      limit,
      total,
      hasMore: offset + result.rows.length < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch assigned tasks." });
  }
};
export const createTask = async (req, res) => {
  const { title, description, status, assignee_id } = req.body;
  const creator_id = req.user.id;

  try {
    const result = await db.query(
      "INSERT INTO tasks (title, description, status, assignee_id, creator_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *",
      [title, description, status, assignee_id, creator_id],
    );

    const newTask = result.rows[0];

    // Fetch assignee's email
    if (assignee_id) {
      const userResult = await db.query(
        "SELECT email FROM users WHERE id = $1",
        [assignee_id],
      );
      if (userResult.rows.length > 0) {
        sendTaskNotification(userResult.rows[0].email, title, "assigned");
      }
    }

    res.status(201).json(newTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create task." });
  }
};
export const getTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT 
         t.*,
         u_assignee.email AS assignee_email,
         u_creator.email AS creator_email
       FROM tasks t
       LEFT JOIN users u_assignee ON t.assignee_id = u_assignee.id
       LEFT JOIN users u_creator ON t.creator_id = u_creator.id
       WHERE t.id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch task." });
  }
};
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assignee_id } = req.body;

  try {
    const result = await db.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3, assignee_id = $4, updated_at = NOW() WHERE id = $5 RETURNING *",
      [title, description, status, assignee_id, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const updatedTask = result.rows[0];

    // Fetch current assignee's email and notify
    if (assignee_id) {
      const userResult = await db.query(
        "SELECT email FROM users WHERE id = $1",
        [assignee_id],
      );
      if (userResult.rows.length > 0) {
        sendTaskNotification(userResult.rows[0].email, title, "updated");
      }
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update task." });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM tasks WHERE id = $1", [id]);
    res.status(200).json({ message: "Task deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete task." });
  }
};
