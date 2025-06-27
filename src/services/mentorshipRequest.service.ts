import {pool} from "../config/db.config";

export const sendRequest = async (menteeId: string, mentorId: string) => {
  const query = `
    INSERT INTO "mentorship_request" ("menteeId", "mentorId")
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [menteeId, mentorId];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getIncomingRequests = async (mentorId: string) => {
  const query = `
    SELECT 
      r.id,
      r.status,
      r."createdAt",
      u.id AS "menteeId",
      u.username,
      u.email
    FROM "mentorship_request" r
    JOIN "users" u ON r."menteeId" = u.id
    WHERE r."mentorId" = $1
    ORDER BY r."createdAt" DESC;
  `;
  const { rows } = await pool.query(query, [mentorId]);
  return rows;
};

export const updateRequestStatus = async (
  id: number,
  status: "pending" | "accepted" | "rejected"
) => {
  // First check if request exists
  const checkQuery = `SELECT * FROM "mentorship_request" WHERE id = $1;`;
  const check = await pool.query(checkQuery, [id]);

  if (check.rows.length === 0) throw new Error("Request not found");

  const updateQuery = `
    UPDATE "mentorship_request"
    SET status = $1, "updatedAt" = NOW()
    WHERE id = $2
    RETURNING *;
  `;

  const { rows } = await pool.query(updateQuery, [status, id]);
  return rows[0];
};

export const createMatch = async (menteeId: string, mentorId: string) => {
  const query = `
    INSERT INTO "mentorship_match" ("menteeId", "mentorId")
    VALUES ($1, $2)
    RETURNING *;
  `;
  const values = [menteeId, mentorId];

  const { rows } = await pool.query(query, values);
  return rows[0];
};
