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
};

db.connect()
  .then(async () => {
    console.log("Connected to PostgreSQL");
    try {
      await ensureTaskColumns();
    } catch (err) {
      console.error("Failed to ensure task timestamp columns", err);
    }
  })
  .catch((err) => console.error("Database connection error", err));

export default db;
