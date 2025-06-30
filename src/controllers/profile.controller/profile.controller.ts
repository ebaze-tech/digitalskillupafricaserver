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

    const existingUser = await client.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username, userId]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Username already taken" });
    }

    await client.query(
      `UPDATE users SET username = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
      [username, userId]
    );

    let mentorId: string | undefined;
    let menteeId: string | undefined;

    switch (role) {
      case "admin": {
        const exists = await client.query(
          `SELECT 1 FROM admins WHERE "userId" = $1`,
          [userId]
        );

        if ((exists.rowCount ?? 0) > 0) {
          await client.query(
            `UPDATE admins SET "shortBio" = $1, goals = $2 WHERE "userId" = $3`,
            [shortBio, goals, userId]
          );
        } else {
          await client.query(
            `INSERT INTO admins ("adminId", "userId", "shortBio", goals)
             VALUES ($1, $2, $3, $4)`,
            [uuidv4(), userId, shortBio, goals]
          );
        }
        break;
      }

      case "mentor": {
        const result = await client.query(
          `SELECT "mentorId" FROM mentors WHERE "userId" = $1`,
          [userId]
        );
        if ((result.rowCount ?? 0) > 0) {
          mentorId = result.rows[0].mentorId;
          await client.query(
            `UPDATE mentors
             SET "shortBio" = $1, goals = $2, username = $3, industry = $4,
                 experience = $5, availability = $6
             WHERE "userId" = $7`,
            [
              shortBio,
              goals,
              username,
              industry,
              experience,
              availability,
              userId,
            ]
          );
        } else {
          mentorId = uuidv4();
          await client.query(
            `INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username, industry, experience, availability)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              mentorId,
              userId,
              shortBio,
              goals,
              username,
              industry,
              experience,
              availability,
            ]
          );
        }
        break;
      }

      case "mentee": {
        const result = await client.query(
          `SELECT "menteeId" FROM mentees WHERE "userId" = $1`,
          [userId]
        );

        if ((result.rowCount ?? 0) > 0) {
          menteeId = result.rows[0].menteeId;
          await client.query(
            `UPDATE mentees
             SET "shortBio" = $1, goals = $2, username = $3
             WHERE "userId" = $4`,
            [shortBio, goals, username, userId]
          );
        } else {
          menteeId = uuidv4();
          await client.query(
            `INSERT INTO mentees ("menteeId", "userId", "shortBio", goals, username)
             VALUES ($1, $2, $3, $4, $5)`,
            [menteeId, userId, shortBio, goals, username]
          );
        }
        break;
      }

      default:
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid user role" });
    }

    // Insert skills into `skills` table
    const skillIds: string[] = [];
    for (const skillName of skills) {
      const result = await client.query(
        `INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skillName.trim()]
      );
      if (result.rows[0]?.id) {
        skillIds.push(result.rows[0].id);
      }
    }

    // Handle junction tables
    if (role === "mentor" && mentorId) {
      await client.query(`DELETE FROM mentor_skills WHERE "mentorId" = $1`, [
        mentorId,
      ]);
      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO mentor_skills ("mentorId", "skillId") VALUES ($1, $2)`,
          [mentorId, skillId]
        );
      }
    }

    if (role === "mentee" && menteeId) {
      await client.query(`DELETE FROM user_skills WHERE "menteeId" = $1`, [
        menteeId,
      ]);
      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO user_skills ("menteeId", "skillId", "userId") VALUES ($1, $2, $3)`,
          [menteeId, skillId, userId]
        );
      }
    }

    await client.query("COMMIT");
    return res.status(200).json({ message: "Profile updated successfully" });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Profile update error:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message || "Unexpected error",
    });
  } finally {
    client.release();
  }
};
