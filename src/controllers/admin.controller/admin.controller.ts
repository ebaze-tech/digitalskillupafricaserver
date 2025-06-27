import { Request, Response } from "express";
import { pool } from "../../config/db.config";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const query = `SELECT id, username, email, role, "createdAt" FROM users ORDER BY "createdAt" DESC;`;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

export const getAllMentorshipMatches = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        m.id AS match_id,
        mentor.username AS mentor_name,
        mentee.username AS mentee_name,
        m."createdAt"
      FROM mentorship_match m
      JOIN users mentor ON m."mentorId" = mentor.id
      JOIN users mentee ON m."menteeId" = mentee.id
      ORDER BY m."createdAt" DESC;
    `;
    const { rows } = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch mentorship matches." });
  }
};

export const getSessionStats = async (req: Request, res: Response) => {
  try {
    const query = `SELECT COUNT(*) FROM session_bookings WHERE status = 'completed';`;
    const { rows } = await pool.query(query);
    res
      .status(200)
      .json({ totalCompletedSessions: parseInt(rows[0].count, 10) });
  } catch (error) {
    console.error("Error getting session stats:", error);
    res.status(500).json({ error: "Failed to get session stats." });
  }
};

export const assignMentor = async (req: Request, res: Response) => {
  const { mentorId, menteeId } = req.body;

  if (!mentorId || !menteeId) {
    return res
      .status(400)
      .json({ error: "mentorId and menteeId are required." });
  }

  try {
    const existsQuery = `
      SELECT * FROM mentorship_matches
      WHERE "mentorId" = $1 AND "menteeId" = $2;
    `;
    const exists = await pool.query(existsQuery, [mentorId, menteeId]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Match already exists." });
    }

    const insertQuery = `
      INSERT INTO mentorship_matches ("mentorId", "menteeId")
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(insertQuery, [mentorId, menteeId]);
    res
      .status(201)
      .json({ message: "Mentor assigned successfully", match: rows[0] });
  } catch (error) {
    console.error("Error assigning mentor:", error);
    res.status(500).json({ error: "Failed to assign mentor." });
  }
};
