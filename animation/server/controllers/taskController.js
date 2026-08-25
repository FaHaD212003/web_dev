import db from "../config/db.js";

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
      "SELECT * FROM tasks WHERE assignee_id = $1 OR creator_id = $1 ORDER BY id DESC",
      [userId],
    );
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your tasks." });
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
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
    res.status(200).json(result.rows[0]);
  } catch (err) {
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
