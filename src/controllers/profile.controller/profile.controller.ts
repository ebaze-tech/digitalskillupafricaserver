import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../../config/db.config";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "mentor" | "mentee";
    email: string;
    username: string;
    industry: string;
    experience: string;
    availability: string;
    mentorId?: string;
  };
}

export const completeUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const {
    username,
    shortBio,
    goals,
    skills,
    industry,
    experience,
    availability,
  } = req.body;

  const userId = req.user?.id;
  const role = req.user?.role;

  if (!userId || !role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (
    !username ||
    !shortBio ||
    !goals ||
    !Array.isArray(skills) ||
    !industry ||
    !experience ||
    !availability
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Update users table
    const existingUser = await client.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username, userId]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      res.status(409).json({ message: "Username already taken" });
      return;
    }

    await client.query(
      `UPDATE users SET username = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
      [username, userId]
    );

    const commonValues = [
      userId,
      shortBio,
      goals,
      username,
      industry,
      experience,
      availability,
    ];

    let query = "";
    let values: any[] = [];
    let existsQuery = "";
    let existsResult;
    let mentorId = userId;
    let menteeId = userId;

    switch (role) {
      case "admin":
        existsQuery = `SELECT 1 FROM admins WHERE "userId" = $1`;
        existsResult = await client.query(existsQuery, [userId]);

        if (existsResult.rowCount! > 0) {
          query = `
            UPDATE admins
            SET "shortBio" = $1, goals = $2
            WHERE "userId" = $3
          `;
          values = [shortBio, goals, userId];
        } else {
          query = `
            INSERT INTO admins ("adminId", "userId", "shortBio", goals)
            VALUES ($1, $2, $3, $4)
          `;
          values = [uuidv4(), userId, shortBio, goals];
        }
        await client.query(query, values);
        break;

      case "mentor":
        existsQuery = `SELECT "mentorId" FROM mentors WHERE "userId" = $1`;
        existsResult = await client.query(existsQuery, [userId]);

        if (existsResult.rowCount! > 0) {
          mentorId = existsResult.rows[0].mentorId;
          query = `
          UPDATE mentors
          SET "shortBio" = $1, goals = $2, username = $3, industry = $4, experience = $5, availability = $6
          WHERE "userId" = $7
          `;
          values = [
            shortBio,
            goals,
            username,
            industry,
            experience,
            availability,
            userId,
          ];
        } else {
          mentorId = uuidv4();
          query = `
            INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username, industry, experience, availability)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;
          values = [mentorId, ...commonValues];
        }
        break;

      case "mentee":
        existsQuery = `SELECT 1 FROM mentees WHERE "userId" = $1`;
        existsResult = await client.query(existsQuery, [userId]);

        if (existsResult.rowCount! > 0) {
          menteeId = existsResult.rows[0].menteeId;
          query = `
            UPDATE mentees
            SET "shortBio" = $1, goals = $2, username = $3
            WHERE "userId" = $4
          `;
          values = [shortBio, goals, username, userId];
        } else {
          menteeId = uuidv4();
          query = `
            INSERT INTO mentees ("menteeId", "userId", "shortBio", goals, username)
            VALUES ($1, $2, $3, $4, $5)
          `;
          values = [menteeId, ...commonValues];
        }
        break;

      default:
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid user role" });
    }

    await client.query(query, values);

    const skillIds: string[] = [];

    for (const skillName of skills) {
      const { rows } = await client.query(
        `INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skillName]
      );
      skillIds.push(rows[0].id);
    }

    if (role === "mentor") {
      await client.query(`DELETE FROM mentor_skills WHERE "mentorId" = $1`, [
        mentorId,
      ]);

      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO mentor_skills ("mentorId", "skillId") VALUES ($1, $2)`,
          [mentorId, skillId]
        );
      }
    } else if (role === "mentee") {
      await client.query(`DELETE FROM user_skills WHERE "menteeId" = $1`, [
        menteeId,
      ]);

      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO user_skills ("menteeId", "skillId") VALUES ($1, $2)`,
          [menteeId, skillId]
        );
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Profile update error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message || "Unexpected error",
    });
  } finally {
    client.release();
  }
};
