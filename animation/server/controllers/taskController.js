import db from "../config/db.js";
import { sendTaskNotification } from "../utils/sendEmail.js";

export const getAllTasks = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tasks ORDER BY id DESC");
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY id DESC",
      [userId],
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your tasks." });
  }
};

export const getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      "SELECT * FROM tasks WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1 ORDER BY id DESC",
      [userId],
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch assigned tasks." });
  }
};
export const createTask = async (req, res) => {
  const { title, description, status, assignee_id } = req.body;
  const creator_id = req.user.id;

  try {
    const result = await db.query(
      "INSERT INTO tasks (title, description, status, assignee_id, creator_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
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

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, status, assignee_id } = req.body;

  try {
    const result = await db.query(
      "UPDATE tasks SET title = $1, description = $2, status = $3, assignee_id = $4 WHERE id = $5 RETURNING *",
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
