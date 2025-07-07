import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../../config/db.config";

interface AuthenticatedRequest extends Request {
  body: {
    username: string;
    shortBio: string;
    goals: string;
    skills: string[];
    industry: string;
    experience: string;
    availability?: string;
  };
  user?: {
    id: string;
    role: "admin" | "mentor" | "mentee";
    email: string;
    username: string;
    industry?: string;
    experience?: string;
    availability?: string;
    mentorId?: string;
  };
}

export const completeUserProfiles = async (
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

  const skillOptions = [
    "UI/UX",
    "Graphic Design",
    "Web Development",
    "Mobile Development",
    "Backend Development",
    "Data Science",
    "Machine Learning",
    "DevOps",
    "Project Management",
    "Product Management",
    "Marketing",
    "Content Creation",
  ];

  if (!userId || !role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Validate fields (availability is only required for mentors)
  if (
    !username ||
    !shortBio ||
    !goals ||
    !Array.isArray(skills) ||
    skills.length === 0 ||
    skills.some(
      (skill: string) => !skill.trim() || !skillOptions.includes(skill)
    ) ||
    !industry ||
    !experience ||
    (role === "mentor" && !availability)
  ) {
    return res.status(400).json({
      message:
        "All required fields must be provided, and skills must be a non-empty array of valid strings",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check for duplicate username
    const existingUser = await client.query(
      `SELECT id FROM users WHERE username = $1 AND id != $2`,
      [username, userId]
    );

    if (existingUser.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Username already taken" });
    }

    const query = `
  UPDATE users SET
    username = $1,
    "shortBio" = $2,
    goals = $3,
    industry = $4,
    experience = $5,
    availability = $6,
    skills = $7,
    "updatedAt" = CURRENT_TIMESTAMP
  WHERE id = $8
`;

    const values = [
      username,
      shortBio,
      goals,
      industry,
      experience,
      availability,
      skills,
      userId,
    ];

    await pool.query(query, values);

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
            `UPDATE admins SET "shortBio" = $1, goals = $2 WHERE "userId" = $3, skills - $4`,
            [shortBio, goals, userId, skills]
          );
        } else {
          await client.query(
            `INSERT INTO admins ("adminId", "userId", "shortBio", goals, skills)
             VALUES ($1, $2, $3, $4, $5)`,
            [uuidv4(), userId, shortBio, goals, skills]
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
                 experience = $5, availability = $6, skills = $7
             WHERE "userId" = $8`,
            [
              shortBio,
              goals,
              username,
              industry,
              experience,
              availability,
              skills,
              userId,
            ]
          );
        } else {
          mentorId = uuidv4();
          await client.query(
            `INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username, industry, experience, availability, skills)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              mentorId,
              userId,
              shortBio,
              goals,
              username,
              industry,
              experience,
              availability,
              skills,
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
             SET "shortBio" = $1, goals = $2, username = $3, skills = $4
             WHERE "userId" = $5`,
            [shortBio, goals, username, skills, userId]
          );
        } else {
          menteeId = uuidv4();
          await client.query(
            `INSERT INTO mentees ("menteeId", "userId", "shortBio", goals, username, skills)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [menteeId, userId, shortBio, goals, username, skills]
          );
        }
        break;
      }

      default:
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid user role" });
    }

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

    if (role === "mentor" && mentorId) {
      await client.query(
        `DELETE FROM mentor_skills WHERE "mentorId" = $1 AND "skillId" NOT IN (${skillIds
          .map((_, i) => `$${i + 2}`)
          .join(", ")})`,
        [mentorId, ...skillIds]
      );
      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO mentor_skills ("mentorId", "skillId")
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [mentorId, skillId]
        );
      }
    }

    if (role === "mentee" && menteeId) {
      await client.query(
        `DELETE FROM user_skills WHERE "menteeId" = $1 AND "skillId" NOT IN (${skillIds
          .map((_, i) => `$${i + 2}`)
          .join(", ")})`,
        [menteeId, ...skillIds]
      );
      for (const skillId of skillIds) {
        await client.query(
          `INSERT INTO user_skills ("menteeId", "skillId", "userId")
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [menteeId, skillId, userId]
        );
      }
    }

    const userResult = await client.query(
      `SELECT u.id, u.username, u.email, u.role, m."shortBio", m.goals, m.industry, m.experience, m.availability
       FROM users u
       LEFT JOIN mentors m ON u.id = m."userId"
       LEFT JOIN mentees mt ON u.id = mt."userId"
       WHERE u.id = $1`,
      [userId]
    );

    const updatedUser = userResult.rows[0];
    updatedUser.skills = skills;

    await client.query("COMMIT");
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
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
