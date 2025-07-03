import { pool } from "../config/db.config";

export const sendRequest = async (menteeId: string, mentorId: string) => {
  const query = `
    INSERT INTO mentorship_request ("menteeId", "mentorId", "status", "createdAt", id)
    VALUES ($1, $2, 'pending', NOW(), gen_random_uuid())
    RETURNING 
      id,
      status,
      "createdAt",
      "menteeId",
      (SELECT username FROM users WHERE id = $1) AS "username",
      (SELECT email FROM users WHERE id = $1) AS "email"
  `;
  const { rows } = await pool.query(query, [menteeId, mentorId]);
  return rows[0];
};

export const getIncomingRequests = async (mentorId: string) => {
  const query = `
    SELECT 
      r.id,
      r.status,
      r."createdAt",
      r."menteeId",
      r."mentorId",
      u.username AS "username",
      u.email AS "email"
    FROM "mentorship_request" r
    JOIN "users" u ON r."menteeId" = u.id
    WHERE r."mentorId" = $1
    ORDER BY r."createdAt" DESC;
  `;
  const { rows } = await pool.query(query, [mentorId]);
  console.log(rows);
  return rows;
};

export const updateRequestStatus = async (
  id: string,
  status: "pending" | "accepted" | "rejected",
  mentorId: string
) => {
  try {
    const checkQuery = `
      SELECT id, status, "menteeId", "mentorId" 
      FROM "mentorship_request" 
      WHERE id = $1 AND "mentorId" = $2;
    `;

    const checkResult = await pool.query(checkQuery, [id, mentorId]);
    const existingRequest = checkResult.rows[0];

    if (!existingRequest) return null;

    const updateQuery = `
      UPDATE "mentorship_request"
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2 AND "mentorId" = $3
      RETURNING 
        id,
        "menteeId",
        "mentorId",
        status,
        "createdAt",
        (SELECT username FROM users WHERE id = "menteeId") AS "username",
        (SELECT email FROM users WHERE id = "menteeId") AS "email"
    `;

    const { rows } = await pool.query(updateQuery, [status, id, mentorId]);
    return rows[0];
  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
};

export const createMatch = async (menteeId: string, mentorId: string) => {
  const query = `
    INSERT INTO "mentorship_match" ("menteeId", "mentorId", "createdAt")
    VALUES ($1, $2, NOW())
    RETURNING ID, "menteeId", "mentorId", "createdAt";
  `;
  const values = [menteeId, mentorId];

  const { rows } = await pool.query(query, values);
  return rows[0];
};
