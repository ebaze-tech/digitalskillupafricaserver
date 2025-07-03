import { Request, Response } from "express";
import { pool } from "../../config/db.config";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const query = `SELECT id, username, email, role FROM users ORDER BY id DESC;`;
    console.log(query);

    const { rows } = await pool.query(query);
    res.status(201).json(rows);
    return;
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
};

export const getTotalSessionsHeld = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT COUNT(*) AS session_count
      FROM session_bookings
      WHERE date < CURRENT_DATE
    `;
    const { rows } = await pool.query(query);

    const count = parseInt(rows[0].session_count, 10);
    return res.status(200).json({ totalSessions: count });
  } catch (error) {
    console.error("Error fetching total sessions:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch total sessions held" });
  }
};

export const getAllMentorshipMatches = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        m."menteeId",
        m."mentorId",
        mentee.username AS mentee_username,
        mentee.email AS mentee_email,
        mentor.username AS mentor_username,
        mentor.email AS mentor_email
      FROM mentorship_match m
      JOIN users mentee ON mentee.id = m."menteeId"
      JOIN users mentor ON mentor.id = m."mentorId"
    `;

    const { rows } = await pool.query(query);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching mentorship matches:", error);
    return res.status(500).json({ message: "Failed to fetch matches" });
  }
};

export const getSessionStats = async (req: Request, res: Response) => {
  try {
    const query = `SELECT COUNT(*) FROM session_bookings WHERE status = 'completed';`;

    console.log(query);
    const { rows } = await pool.query(query);
    console.log(rows);

    res
      .status(200)
      .json({ totalCompletedSessions: parseInt(rows[0].count, 10) });
    return;
  } catch (error) {
    console.error("Error getting session stats:", error);
    res.status(500).json({ error: "Failed to get session stats." });
  }
};

export const assignMentor = async (req: Request, res: Response) => {
  const { mentorId, menteeId } = req.body;

  if (!mentorId || !menteeId) {
    return res.status(400).json({
      error: "mentorId and menteeId are required.",
    });
  }

  try {
    const userCheck = await pool.query(
      `SELECT id, role FROM users WHERE id = ANY($1::uuid[])`,
      [[mentorId, menteeId]]
    );

    const roles = userCheck.rows.reduce(
      (acc, user) => ({ ...acc, [user.id]: user.role }),
      {} as Record<string, string>
    );

    if (roles[mentorId] !== "mentor") {
      return res.status(400).json({ error: "Invalid mentor ID." });
    }

    if (roles[menteeId] !== "mentee") {
      return res.status(400).json({ error: "Invalid mentee ID." });
    }

    const exists = await pool.query(
      `SELECT * FROM mentorship_match WHERE "mentorId" = $1 AND "menteeId" = $2`,
      [mentorId, menteeId]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({ message: "Match already exists." });
    }

    const insert = await pool.query(
      `INSERT INTO mentorship_match ("mentorId", "menteeId")
       VALUES ($1, $2)
       RETURNING *;`,
      [mentorId, menteeId]
    );

    res.status(201).json({
      message: "Mentor assigned successfully",
      match: insert.rows[0],
    });
  } catch (error) {
    console.error("Error assigning mentor:", error);
    res.status(500).json({ error: "Failed to assign mentor." });
  }
};

export const assignMentorToMentee = async (req: Request, res: Response) => {
  const { mentorId, menteeId, adminId } = req.body;
  console.log("Received:", { mentorId, menteeId, adminId });

  if (!mentorId || !menteeId || !adminId) {
    return res.status(400).json({
      error: "mentorId, menteeId, and adminId are required.",
    });
  }

  const isValidUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      str
    );

  if (
    !isValidUUID(mentorId) ||
    !isValidUUID(menteeId) ||
    !isValidUUID(adminId)
  ) {
    return res.status(400).json({ error: "Invalid UUID format." });
  }

  try {
    await pool.query("BEGIN");

    // Resolve admin user ID
    const adminResult = await pool.query(
      `SELECT username FROM admins WHERE "userId" = $1`,
      [adminId]
    );

    console.log(adminResult.rows[0]?.username + " Admin result");

    if (adminResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Admin not found in admins table." });
    }

    const adminUsername = adminResult.rows[0].username;

    const adminUserResult = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND role = 'admin'`,
      [adminUsername]
    );

    if (adminUserResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Admin not found in users table." });
    }

    const resolvedAdminUserId = adminUserResult.rows[0].id;
    console.log(resolvedAdminUserId + "resolved admin user id");

    // Resolve mentor userId
    const mentorResult = await pool.query(
      `SELECT username FROM mentors WHERE "userId" = $1`,
      [mentorId]
    );
    console.log(mentorResult.rows[0]?.username + " Mentor user result");

    if (mentorResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Mentor not found in mentors table." });
    }

    const mentorUsername = mentorResult.rows[0].username;

    const mentorUserResult = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND role = 'mentor'`,
      [mentorUsername]
    );

    if (mentorUserResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res
        .status(400)
        .json({ error: "Mentor not found in mentors table." });
    }

    const resolvedMentorUserId = mentorUserResult.rows[0].id;
    console.log(resolvedMentorUserId + "resolved mentee user id");

    const menteeResult = await pool.query(
      `SELECT username FROM mentees WHERE "userId" = $1`,
      [menteeId]
    );
    console.log(menteeResult.rows[0]?.username + "Mentee result");

    if (menteeResult.rowCount === 0) {
      await pool.query("ROLLBACK");

      return res
        .status(400)
        .json({ error: "Mentee not found in mentees table" });
    }

    const menteeUsername = menteeResult.rows[0].username;

    const menteeUserResult = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND role = 'mentee'`,
      [menteeUsername]
    );
    // console.log(menteeUserResult + "mentee user query res" + menteeUsername);

    if (menteeUserResult.rowCount === 0) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Mentee not found in users table" });
    }

    const resolvedMenteeUserId = menteeUserResult.rows[0].id;
    console.log(resolvedMenteeUserId + "resolved mentee user id");

    const existing = await pool.query(
      `SELECT 1 FROM mentorship_match WHERE "menteeId" = $1`,
      [resolvedMenteeUserId]
    );

    if ((existing.rowCount ?? 0) > 0) {
      await pool.query("ROLLBACK");
      return res.status(409).json({ message: "Mentee already has a mentor." });
    }

    // Insert match using user IDs
    const insert = await pool.query(
      `INSERT INTO mentorship_match ("mentorId", "menteeId", "adminId", id)
       VALUES ($1, $2, $3, uuid_generate_v4())
       RETURNING *`,
      [resolvedMentorUserId, resolvedMenteeUserId, resolvedAdminUserId]
    );

    await pool.query("COMMIT");

    return res.status(201).json({
      message: "Mentor assigned successfully.",
      data: insert.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error assigning mentor:", error);
    return res.status(500).json({
      error: "Failed to assign mentor due to a server error.",
    });
  }
};

export const getAdminById = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.adminId;

    if (!adminId) {
      return res.status(400).json({ error: "Admin ID is required." });
    }

    const query = `
      SELECT 
        a."adminId", 
        u."id" as "userId",
        u.username, 
        u.email, 
        'admin' AS role
      FROM admins a
      JOIN users u ON u.id = a."userId"
      WHERE a."adminId" = $1
    `;

    const { rows } = await pool.query(query, [adminId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found." });
    }

    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching admin:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        s.id,
        s.date,
        s.start_time,
        s.end_time,
        u_mentees.username AS "menteeUsername",
        u_mentors.username AS "mentorUsername"
      FROM session_bookings s
      JOIN users u_mentees ON u_mentees.id = s."menteeId"
      JOIN users u_mentors ON u_mentors.id = s."mentorId"
      ORDER BY s.date DESC, s.start_time ASC;
    `;

    const { rows } = await pool.query(query);

    res.status(200).json({
      message: "Sessions retrieved successfully",
      sessions: rows,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to retrieve sessions." });
  }
};

export const addUser = async (req: Request, res: Response) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }
  const validRoles = ["admin", "mentor", "mentee"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  try {
    const userExists = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );

    if ((userExists.rowCount ?? 0) > 0) {
      return res
        .status(409)
        .json({ error: "Username or email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    const { rows } = await pool.query(
      `INSERT INTO users (id, username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role`,
      [userId, username, email, passwordHash, role]
    );
    const roleId = uuidv4();
    const shortBio = "";
    const goals = "";

    if (role === "mentor") {
      const mentorResult = await pool.query(
        `INSERT INTO mentors ("mentorId", "userId", username,"shortBio", goals) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "mentorId", "userId","shortBio", goals`,
        [roleId, userId, username, shortBio, goals]
      );
      console.log("Inserted mentor:", mentorResult.rows[0]);
    } else if (role === "mentee") {
      const menteeResult = await pool.query(
        `INSERT INTO mentees ("menteeId", "userId", username, "shortBio", goals) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "menteeId", "userId","shortBio", goals`,
        [roleId, userId, username, shortBio, goals]
      );
      console.log("Inserted mentee:", menteeResult.rows[0]);
    } else if (role === "admin") {
      const adminResult = await pool.query(
        `INSERT INTO admins ("adminId", "userId", username, "shortBio", goals) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "adminId", "userId", "shortBio", goals`,
        [roleId, userId, username, shortBio, goals]
      );
      console.log("Inserted admin:", adminResult.rows[0]);
    }
    await pool.query("COMMIT");

    return res.status(201).json({
      message: "User added successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Error adding user:", err);
    return res.status(500).json({ error: "Server error adding user." });
  }
};

export const editUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;

  if (!id) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const existing = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      id,
    ]);
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (username) {
      fieldsToUpdate.push(`username = $${i++}`);
      values.push(username);
    }
    if (email) {
      fieldsToUpdate.push(`email = $${i++}`);
      values.push(email);
    }
    if (password) {
      fieldsToUpdate.push(`"passwordHash" = $${i++}`);
      values.push(password);
    }
    if (role) {
      const validRoles = ["admin", "mentor", "mentee"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: "Invalid role." });
      }
      fieldsToUpdate.push(`role = $${i++}`);
      values.push(role);
    }

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "No fields provided to update." });
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, username, email, role
    `;

    const { rows } = await pool.query(query, values);

    return res.status(200).json({
      message: "User updated successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Error updating user:", err);
    return res.status(500).json({ error: "Server error updating user." });
  }
};
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "User ID is required." });
      return;
    }

    const { rows } = await pool.query(`SELECT * FROM users WHERE "id" = $1`, [
      id,
    ]);

    if (rows.length === 0) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json(rows[0]);
    return;
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
