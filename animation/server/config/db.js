import pg from "pg";
import env from "dotenv";

env.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

const ensureTaskColumns = async () => {
  await db.query(
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
  );
  await db.query(
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
  );
  await db.query(
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ",
  );
  await db.query(
    "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date_notified BOOLEAN NOT NULL DEFAULT FALSE",
  );
};

const ensureCommentTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await db.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_url TEXT");
  await db.query(
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_name VARCHAR(255)",
  );
  await db.query(
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_size INTEGER",
  );
  await db.query(
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_type VARCHAR(100)",
  );
  await db.query(
    "ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_key VARCHAR(255)",
  );
  // Make content nullable in case a comment is only an attachment
  await db
    .query("ALTER TABLE comments ALTER COLUMN content DROP NOT NULL")
    .catch(() => {});
};

const ensureNotificationTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'task_assigned',
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

db.connect()
  .then(async () => {
    console.log("Connected to PostgreSQL");
    try {
      await ensureTaskColumns();
      await ensureCommentTable();
      await ensureNotificationTable();
    } catch (err) {
      console.error("Failed to ensure database schema columns/tables", err);
    }
  })
  .catch((err) => console.error("Database connection error", err));

export default db;
