import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

/*export const pool = new Pool({
  host: process.env.DB_HOST,
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});
*/
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
