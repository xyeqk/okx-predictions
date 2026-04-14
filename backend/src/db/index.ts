import { Pool } from "pg";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("[DB] DATABASE_URL not set — using local Postgres on localhost:5432/predictx");
}

const pool = new Pool({
  connectionString: connectionString || "postgres://postgres:postgres@localhost:5432/predictx",
  ssl: connectionString?.includes("render.com") || connectionString?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : false,
});

// Initialize schema on startup
async function initSchema() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  try {
    await pool.query(schema);
    console.log("[DB] Schema initialized");
  } catch (err: any) {
    console.error("[DB] Schema init error:", err.message);
  }
}

initSchema();

// Unified API matching the old SQLite interface patterns
export default {
  // Raw query
  query: (text: string, params?: any[]) => pool.query(text, params),

  // Get a single row
  get: async <T = any>(text: string, params: any[] = []): Promise<T | undefined> => {
    const r = await pool.query(text, params);
    return r.rows[0];
  },

  // Get all rows
  all: async <T = any>(text: string, params: any[] = []): Promise<T[]> => {
    const r = await pool.query(text, params);
    return r.rows;
  },

  // Run (insert/update/delete) — returns affected rows
  run: async (text: string, params: any[] = []) => {
    const r = await pool.query(text, params);
    return { changes: r.rowCount, lastInsertId: r.rows[0]?.id };
  },

  // Prepare-like helper that returns an object with { get, all, run } bound to params
  prepare: (text: string) => ({
    get: async <T = any>(...params: any[]): Promise<T | undefined> => {
      const r = await pool.query(text, params);
      return r.rows[0];
    },
    all: async <T = any>(...params: any[]): Promise<T[]> => {
      const r = await pool.query(text, params);
      return r.rows;
    },
    run: async (...params: any[]) => {
      const r = await pool.query(text, params);
      return { changes: r.rowCount };
    },
  }),
};

export { pool };
