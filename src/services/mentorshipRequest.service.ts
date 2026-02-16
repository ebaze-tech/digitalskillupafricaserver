import { pool } from '../config/db.config'

/**
 * Common columns returned when fetching request details
 * Joining users table is cleaner than multiple subqueries.
 */
const REQUEST_DETAIL_COLUMNS = `
  r.id, r.status, r."createdAt", r."menteeId", r."mentorId",
  u.username, u.email
`

export const sendRequest = async (menteeId: string, mentorId: string) => {
  const query = `
    WITH inserted AS (
      INSERT INTO mentorship_request ("menteeId", "mentorId", status, "createdAt")
      VALUES ($1, $2, 'pending', NOW())
      RETURNING *
    )
    SELECT ${REQUEST_DETAIL_COLUMNS}
    FROM inserted r
    JOIN users u ON r."menteeId" = u.id;
  `

  const { rows } = await pool.query(query, [menteeId, mentorId])
  return rows[0]
}

export const getIncomingRequests = async (mentorId: string) => {
  const query = `
    SELECT ${REQUEST_DETAIL_COLUMNS}
    FROM mentorship_request r
    JOIN users u ON r."menteeId" = u.id
    WHERE r."mentorId" = $1
    ORDER BY r."createdAt" DESC;
  `

  const { rows } = await pool.query(query, [mentorId])
  return rows
}

export const updateRequestStatus = async (
  id: string,
  status: 'pending' | 'accepted' | 'rejected',
  mentorId: string
) => {
  // Use a single query to check existence and update simultaneously
  const query = `
    UPDATE mentorship_request r
    SET status = $1, "updatedAt" = NOW()
    FROM users u
    WHERE r.id = $2 
      AND r."mentorId" = $3 
      AND r."menteeId" = u.id
    RETURNING ${REQUEST_DETAIL_COLUMNS};
  `

  try {
    const { rows } = await pool.query(query, [status, id, mentorId])
    return rows[0] || null
  } catch (error) {
    console.error('Service Error [updateRequestStatus]:', error)
    throw error
  }
}

export const createMatch = async (menteeId: string, mentorId: string) => {
  const query = `
    INSERT INTO mentorship_match ("menteeId", "mentorId", "createdAt")
    VALUES ($1, $2, NOW())
    ON CONFLICT ("menteeId", "mentorId") DO NOTHING
    RETURNING id, "menteeId", "mentorId", "createdAt";
  `

  const { rows } = await pool.query(query, [menteeId, mentorId])
  return rows[0]
}
