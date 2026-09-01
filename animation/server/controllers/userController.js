import db from "../config/db.js";

export const getEmployees = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, email, role, is_revoked FROM users WHERE role = 'user' ORDER BY email ASC",
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch roster." });
  }
};

export const getDashboardStats = async (req, res) => {
  const range =
    req.query.range === "yearly"
      ? "yearly"
      : req.query.range === "weekly"
        ? "weekly"
        : "monthly";

  const rangeConfig = {
    weekly: { interval: "7 days", bucket: "day" },
    monthly: { interval: "30 days", bucket: "week" },
    yearly: { interval: "365 days", bucket: "month" },
  }[range];

  try {
    const summaryResult = await db.query(
      `
        WITH filtered_tasks AS (
          SELECT *
          FROM tasks
          WHERE created_at >= NOW() - INTERVAL '${rangeConfig.interval}'
        )
        SELECT
          (SELECT COUNT(*) FROM users) AS total_users,
          (SELECT COUNT(*) FROM tasks) AS total_tasks,
          (SELECT COUNT(*) FROM filtered_tasks) AS period_tasks,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks
        FROM filtered_tasks;
      `,
    );

    const trendResult = await db.query(
      `
        SELECT
          date_trunc('${rangeConfig.bucket}', created_at) AS period,
          TO_CHAR(date_trunc('${rangeConfig.bucket}', created_at), 'YYYY-MM-DD') AS period_key,
          TO_CHAR(date_trunc('${rangeConfig.bucket}', created_at), 'Mon DD, YYYY') AS period_label,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_tasks,
          COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_tasks,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks,
          COUNT(*) AS total_tasks
        FROM tasks
        WHERE created_at >= NOW() - INTERVAL '${rangeConfig.interval}'
        GROUP BY 1, 2, 3
        ORDER BY 1 ASC;
      `,
    );

    res.status(200).json({
      range,
      totalUsers: Number(summaryResult.rows[0]?.total_users ?? 0),
      totalTasks: Number(summaryResult.rows[0]?.period_tasks ?? 0),
      totalTasksAllTime: Number(summaryResult.rows[0]?.total_tasks ?? 0),
      statusCounts: {
        pending: Number(summaryResult.rows[0]?.pending_tasks ?? 0),
        in_progress: Number(summaryResult.rows[0]?.in_progress_tasks ?? 0),
        completed: Number(summaryResult.rows[0]?.completed_tasks ?? 0),
      },
      trend: trendResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch dashboard stats." });
  }
};

export const searchUsers = async (req, res) => {
  const query = (req.query.query || "").trim();
  const limit = Math.min(Number(req.query.limit || 20), 50);

  try {
    const result = await db.query(
      `
        SELECT id, email, role, is_revoked
        FROM users
        WHERE $1 = '' OR email ILIKE $1
        ORDER BY email ASC
        LIMIT $2;
      `,
      [`%${query}%`, limit],
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to search users." });
  }
};

export const getUserDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const userResult = await db.query(
      "SELECT id, email, role, is_revoked FROM users WHERE id = $1",
      [id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const statsResult = await db.query(
      `
        SELECT
          COUNT(*) FILTER (WHERE assignee_id = $1) AS assigned_to_user,
          COUNT(*) FILTER (WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1) AS assigned_by_user,
          COUNT(*) FILTER (WHERE assignee_id = $1 AND status = 'pending') AS assigned_pending,
          COUNT(*) FILTER (WHERE assignee_id = $1 AND status = 'in_progress') AS assigned_in_progress,
          COUNT(*) FILTER (WHERE assignee_id = $1 AND status = 'completed') AS assigned_completed,
          COUNT(*) FILTER (WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1 AND status = 'pending') AS created_pending,
          COUNT(*) FILTER (WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1 AND status = 'in_progress') AS created_in_progress,
          COUNT(*) FILTER (WHERE creator_id = $1 AND assignee_id IS NOT NULL AND assignee_id <> $1 AND status = 'completed') AS created_completed,
          COUNT(*) FILTER (WHERE creator_id = $1 AND assignee_id = $1) AS self_assigned_tasks
        FROM tasks
        WHERE assignee_id = $1 OR creator_id = $1;
      `,
      [id],
    );

    res.status(200).json({
      user: userResult.rows[0],
      stats: {
        assignedToUser: Number(statsResult.rows[0]?.assigned_to_user ?? 0),
        assignedByUser: Number(statsResult.rows[0]?.assigned_by_user ?? 0),
        assignedStatus: {
          pending: Number(statsResult.rows[0]?.assigned_pending ?? 0),
          in_progress: Number(statsResult.rows[0]?.assigned_in_progress ?? 0),
          completed: Number(statsResult.rows[0]?.assigned_completed ?? 0),
        },
        createdStatus: {
          pending: Number(statsResult.rows[0]?.created_pending ?? 0),
          in_progress: Number(statsResult.rows[0]?.created_in_progress ?? 0),
          completed: Number(statsResult.rows[0]?.created_completed ?? 0),
        },
        selfAssignedTasks: Number(
          statsResult.rows[0]?.self_assigned_tasks ?? 0,
        ),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user detail." });
  }
};

export const updateUserAccess = async (req, res) => {
  const { id } = req.params;
  const { role, is_revoked } = req.body;

  if (!role && typeof is_revoked !== "boolean") {
    return res.status(400).json({ message: "No update fields provided." });
  }

  try {
    const result = await db.query(
      `
        UPDATE users
        SET
          role = COALESCE($1, role),
          is_revoked = COALESCE($2, is_revoked),
          revoked_at = CASE
            WHEN COALESCE($2, is_revoked) = TRUE THEN NOW()
            WHEN COALESCE($2, is_revoked) = FALSE THEN NULL
            ELSE revoked_at
          END
        WHERE id = $3
        RETURNING id, email, role, is_revoked, revoked_at;
      `,
      [role || null, typeof is_revoked === "boolean" ? is_revoked : null, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update user access." });
  }
};
