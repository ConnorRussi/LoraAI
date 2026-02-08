import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString,
  // Add this block back in:
  ssl: {
    rejectUnauthorized: false
  }
});

export function setPool(newPool) {
  pool = newPool;
}