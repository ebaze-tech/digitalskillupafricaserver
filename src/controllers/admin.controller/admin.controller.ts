import { Request, Response } from "express";
console.log("Importing Request and Response from express");
import { pool } from "../../config/db.config";
console.log("Importing pool from db.config");
import bcrypt from "bcryptjs";
console.log("Importing bcrypt");
import { v4 as uuidv4 } from "uuid";
console.log("Importing v4 as uuidv4 from uuid");

export const getAllUsers = async (req: Request, res: Response) => {
  console.log("Entering getAllUsers function");
  try {
    console.log("Defining query to fetch all users");
    const query = `SELECT id, username, email, role FROM users ORDER BY id DESC;`;
    console.log("Query:", query);

    console.log("Executing query");
    const { rows } = await pool.query(query);
    console.log("Query result:", rows);

    console.log("Sending 201 response with users");
    res.status(201).json(rows);
    console.log("Response sent");
    return;
  } catch (error) {
    console.error("Error fetching users:", error);
    console.log("Sending 500 response for error");
    res.status(500).json({ error: "Failed to fetch users." });
    console.log("Error response sent");
  }
};
console.log("Exported getAllUsers function");

export const getTotalSessionsHeld = async (req: Request, res: Response) => {
  console.log("Entering getTotalSessionsHeld function");
  try {
    console.log("Defining query for total sessions held");
    const query = `
      SELECT COUNT(*) AS session_count
      FROM session_bookings
      WHERE date < CURRENT_DATE
    `;
    console.log("Query:", query);

    console.log("Executing query");
    const { rows } = await pool.query(query);
    console.log("Query result:", rows);

    console.log("Parsing session count");
    const count = parseInt(rows[0].session_count, 10);
    console.log("Parsed session count:", count);

    console.log("Sending 200 response with total sessions");
    return res.status(200).json({ totalSessions: count });
  } catch (error) {
    console.error("Error fetching total sessions:", error);
    console.log("Sending 500 response for error");
    return res
      .status(500)
      .json({ message: "Failed to fetch total sessions held" });
  }
};
console.log("Exported getTotalSessionsHeld function");

export const getAllMentorshipMatches = async (req: Request, res: Response) => {
  console.log("Entering getAllMentorshipMatches function");
  try {
    console.log("Defining query for mentorship matches");
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
    console.log("Query:", query);

    console.log("Executing query");
    const { rows } = await pool.query(query);
    console.log("Query result:", rows);

    console.log("Sending 200 response with mentorship matches");
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching mentorship matches:", error);
    console.log("Sending 500 response for error");
    return res.status(500).json({ message: "Failed to fetch matches" });
  }
};
console.log("Exported getAllMentorshipMatches function");

export const getSessionStats = async (req: Request, res: Response) => {
  console.log("Entering getSessionStats function");
  try {
    console.log("Defining query for session stats");
    const query = `SELECT COUNT(*) FROM session_bookings WHERE status = 'completed';`;
    console.log("Query:", query);

    console.log("Executing query");
    const { rows } = await pool.query(query);
    console.log("Query result:", rows);

    console.log("Sending 200 response with session stats");
    res
      .status(200)
      .json({ totalCompletedSessions: parseInt(rows[0].count, 10) });
    console.log("Response sent");
    return;
  } catch (error) {
    console.error("Error getting session stats:", error);
    console.log("Sending 500 response for error");
    res.status(500).json({ error: "Failed to get session stats." });
    console.log("Error response sent");
  }
};
console.log("Exported getSessionStats function");

export const assignMentor = async (req: Request, res: Response) => {
  console.log("Entering assignMentor function");
  console.log("Destructuring req.body");
  const { mentorId, menteeId } = req.body;
  console.log("Request body:", { mentorId, menteeId });

  console.log("Validating mentorId and menteeId");
  if (!mentorId || !menteeId) {
    console.log("Missing mentorId or menteeId");
    return res.status(400).json({
      error: "mentorId and menteeId are required.",
    });
  }
  console.log("mentorId and menteeId validated");

  try {
    console.log("Checking user roles");
    const userCheck = await pool.query(
      `SELECT id, role FROM users WHERE id = ANY($1::uuid[])`,
      [[mentorId, menteeId]]
    );
    console.log("User check result:", userCheck.rows);

    console.log("Reducing user roles");
    const roles = userCheck.rows.reduce(
      (acc, user) => ({ ...acc, [user.id]: user.role }),
      {} as Record<string, string>
    );
    console.log("Roles:", roles);

    console.log("Validating mentor role");
    if (roles[mentorId] !== "mentor") {
      console.log("Invalid mentor ID");
      return res.status(400).json({ error: "Invalid mentor ID." });
    }
    console.log("Mentor role validated");

    console.log("Validating mentee role");
    if (roles[menteeId] !== "mentee") {
      console.log("Invalid mentee ID");
      return res.status(400).json({ error: "Invalid mentee ID." });
    }
    console.log("Mentee role validated");

    console.log("Checking for existing match");
    const exists = await pool.query(
      `SELECT * FROM mentorship_match WHERE "mentorId" = $1 AND "menteeId" = $2`,
      [mentorId, menteeId]
    );
    console.log("Existing match result:", exists.rows);
    if (exists.rows.length > 0) {
      console.log("Match already exists");
      return res.status(409).json({ message: "Match already exists." });
    }
    console.log("No existing match found");

    console.log("Inserting new mentorship match");
    const insert = await pool.query(
      `INSERT INTO mentorship_match ("mentorId", "menteeId")
       VALUES ($1, $2)
       RETURNING *;`,
      [mentorId, menteeId]
    );
    console.log("Insert result:", insert.rows);

    console.log("Sending 201 response with match data");
    res.status(201).json({
      message: "Mentor assigned successfully",
      match: insert.rows[0],
    });
  } catch (error) {
    console.error("Error assigning mentor:", error);
    console.log("Sending 500 response for error");
    res.status(500).json({ error: "Failed to assign mentor." });
    console.log("Error response sent");
  }
};
console.log("Exported assignMentor function");

export const assignMentorToMentee = async (req: Request, res: Response) => {
  console.log("Entering assignMentorToMentee function");
  console.log("Destructuring req.body");
  const { mentorId, menteeId, adminId } = req.body;
  console.log("Received:", { mentorId, menteeId, adminId });

  console.log("Validating required fields");
  if (!mentorId || !menteeId || !adminId) {
    console.log("Missing required fields");
    return res.status(400).json({
      error: "mentorId, menteeId, and adminId are required.",
    });
  }
  console.log("Required fields validated");

  console.log("Defining isValidUUID function");
  const isValidUUID = (str: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      str
    );
  console.log("isValidUUID function defined");

  console.log("Validating UUID formats");
  if (
    !isValidUUID(mentorId) ||
    !isValidUUID(menteeId) ||
    !isValidUUID(adminId)
  ) {
    console.log("Invalid UUID format");
    return res.status(400).json({ error: "Invalid UUID format." });
  }
  console.log("UUID formats validated");

  try {
    console.log("Beginning transaction");
    await pool.query("BEGIN");
    console.log("Transaction started");

    console.log("Checking admin in admins table");
    const adminResult = await pool.query(
      `SELECT username FROM admins WHERE "userId" = $1`,
      [adminId]
    );
    console.log("Admin query result:", adminResult.rows[0]?.username);

    if (adminResult.rowCount === 0) {
      console.log("Admin not found in admins table");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res
        .status(400)
        .json({ error: "Admin not found in admins table." });
    }
    console.log("Admin found");

    console.log("Retrieving admin username");
    const adminUsername = adminResult.rows[0].username;
    console.log("Admin username:", adminUsername);

    console.log("Verifying admin in users table");
    const adminUserResult = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND role = 'admin'`,
      [adminUsername]
    );
    console.log("Admin user query result:", adminUserResult.rows);
    if (adminUserResult.rowCount === 0) {
      console.log("Admin not found in users table");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res.status(400).json({ error: "Admin not found in users table." });
    }
    console.log("Admin verified in users table");

    console.log("Retrieving resolved admin user ID");
    const resolvedAdminUserId = adminUserResult.rows[0].id;
    console.log("Resolved admin user ID:", resolvedAdminUserId);

    console.log("Checking mentor in mentors table");
    const mentorResult = await pool.query(
      `SELECT username FROM mentors WHERE "userId" = $1`,
      [mentorId]
    );
    console.log("Mentor query result:", mentorResult.rows[0]?.username);

    if (mentorResult.rowCount === 0) {
      console.log("Mentor not found in mentors table");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res
        .status(400)
        .json({ error: "Mentor not found in mentors table." });
    }
    console.log("Mentor found");

    console.log("Retrieving mentor username");
    const mentorUsername = mentorResult.rows[0].username;
    console.log("Mentor username:", mentorUsername);

    console.log("Verifying mentor in users table");
    const mentorUserResult = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND role = 'mentor'`,
      [mentorUsername]
    );
    console.log("Mentor user query result:", mentorUserResult.rows);
    if (mentorUserResult.rowCount === 0) {
      console.log("Mentor not found in users table");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res
        .status(400)
        .json({ error: "Mentor not found in users table." });
    }
    console.log("Mentor verified in users table");

    console.log("Retrieving resolved mentor user ID");
    const resolvedMentorUserId = mentorUserResult.rows[0].id;
    console.log("Resolved mentor user ID:", resolvedMentorUserId);

    console.log("Checking mentee in mentees table");
    const menteeResult = await pool.query(
      `SELECT username FROM mentees WHERE "userId" = $1`,
      [menteeId]
    );
    console.log("Mentee query result:", menteeResult.rows[0]?.username);

    if (menteeResult.rowCount === 0) {
      console.log("Mentee not found in mentees table");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res
        .status(400)
        .json({ error: "Mentee not found in mentees table" });
    }
    console.log("Mentee found");

    console.log("Retrieving mentee username");
    const menteeUsername = menteeResult.rows[0].username;
    console.log("Mentee username:", menteeUsername);

    console.log("Verifying mentee in users table");
    const menteeUserResult = await pool.query(
      `SELECT id FROM users WHERE username = $1 AND role = 'mentee'`,
      [menteeUsername]
    );
    console.log("Mentee user query result:", menteeUserResult.rows);
    if (menteeUserResult.rowCount === 0) {
      console.log("Mentee not found in users table");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res.status(400).json({ error: "Mentee not found in users table" });
    }
    console.log("Mentee verified in users table");

    console.log("Retrieving resolved mentee user ID");
    const resolvedMenteeUserId = menteeUserResult.rows[0].id;
    console.log("Resolved mentee user ID:", resolvedMenteeUserId);

    console.log("Checking for existing mentorship match");
    const existing = await pool.query(
      `SELECT 1 FROM mentorship_match WHERE "menteeId" = $1`,
      [resolvedMenteeUserId]
    );
    console.log("Existing match result:", existing.rows);
    if ((existing.rowCount ?? 0) > 0) {
      console.log("Mentee already has a mentor");
      await pool.query("ROLLBACK");
      console.log("Transaction rolled back");
      return res.status(409).json({ message: "Mentee already has a mentor." });
    }
    console.log("No existing mentorship match found");

    console.log("Inserting new mentorship match");
    const insert = await pool.query(
      `INSERT INTO mentorship_match ("mentorId", "menteeId", "adminId", id)
       VALUES ($1, $2, $3, uuid_generate_v4())
       RETURNING *`,
      [resolvedMentorUserId, resolvedMenteeUserId, resolvedAdminUserId]
    );
    console.log("Insert result:", insert.rows);

    console.log("Committing transaction");
    await pool.query("COMMIT");
    console.log("Transaction committed");

    console.log("Sending 201 response with match data");
    return res.status(201).json({
      message: "Mentor assigned successfully.",
      data: insert.rows[0],
    });
  } catch (error) {
    console.log("Caught error in try block");
    await pool.query("ROLLBACK");
    console.log("Transaction rolled back due to error");
    console.error("Error assigning mentor:", error);
    console.log("Sending 500 response for error");
    return res.status(500).json({
      error: "Failed to assign mentor due to a server error.",
    });
  }
};
console.log("Exported assignMentorToMentee function");

export const getAdminById = async (req: Request, res: Response) => {
  console.log("Entering getAdminById function");
  try {
    console.log("Retrieving adminId from req.user");
    const id = req.user?.adminId;
    console.log("Admin ID:", id);

    if (!id) {
      console.log("Admin ID is required");
      return res.status(400).json({ error: "Admin ID is required." });
    }
    console.log("Admin ID validated");

    console.log("Defining query for admin");
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
    console.log("Query:", query);

    console.log("Executing query");
    const { rows } = await pool.query(query, [id]);
    console.log("Query result:", rows);

    if (rows.length === 0) {
      console.log("Admin not found");
      return res.status(404).json({ error: "Admin not found." });
    }
    console.log("Admin found");

    console.log("Sending 200 response with admin data");
    return res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching admin:", error);
    console.log("Sending 500 response for error");
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
console.log("Exported getAdminById function");

export const getAllSessions = async (req: Request, res: Response) => {
  console.log("Entering getAllSessions function");
  try {
    console.log("Defining query for all sessions");
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
    console.log("Query:", query);

    console.log("Executing query");
    const { rows } = await pool.query(query);
    console.log("Query result:", rows);

    console.log("Sending 200 response with sessions");
    res.status(200).json({
      message: "Sessions retrieved successfully",
      sessions: rows,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    console.log("Sending 500 response for error");
    res.status(500).json({ error: "Failed to retrieve sessions." });
    console.log("Error response sent");
  }
};
console.log("Exported getAllSessions function");

export const addUser = async (req: Request, res: Response) => {
  console.log("Entering addUser function");
  console.log("Destructuring req.body");
  const { username, email, password, role } = req.body;
  console.log("Request body:", { username, email, password, role });

  console.log("Validating required fields");
  if (!username || !email || !password || !role) {
    console.log("Missing required fields");
    return res.status(400).json({ error: "All fields are required." });
  }
  console.log("Required fields validated");

  console.log("Validating role");
  const validRoles = ["admin", "mentor", "mentee"];
  console.log("Valid roles:", validRoles);
  if (!validRoles.includes(role)) {
    console.log("Invalid role specified");
    return res.status(400).json({ error: "Invalid role specified." });
  }
  console.log("Role validated");

  try {
    console.log("Checking for existing user");
    const userExists = await pool.query(
      `SELECT * FROM users WHERE username = $1 OR email = $2`,
      [username, email]
    );
    console.log("User exists query result:", userExists.rows);
    if ((userExists.rowCount ?? 0) > 0) {
      console.log("Username or email already exists");
      return res
        .status(409)
        .json({ error: "Username or email already exists." });
    }
    console.log("No existing user found");

    console.log("Hashing password");
    const passwordHash = await bcrypt.hash(password, 12);
    console.log("Hashed password:", passwordHash);

    console.log("Generating userId");
    const userId = uuidv4();
    console.log("Generated userId:", userId);

    console.log("Inserting user into users table");
    const { rows } = await pool.query(
      `INSERT INTO users (id, username, email, "passwordHash", role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role`,
      [userId, username, email, passwordHash, role]
    );
    console.log("Inserted user:", rows);

    console.log("Generating roleId");
    const roleId = uuidv4();
    console.log("Generated roleId:", roleId);

    console.log("Initializing shortBio and goals");
    const shortBio = "";
    console.log("shortBio:", shortBio);
    const goals = "";
    console.log("goals:", goals);

    if (role === "mentor") {
      console.log("Inserting into mentors table");
      const mentorResult = await pool.query(
        `INSERT INTO mentors ("mentorId", "userId", username,"shortBio", goals) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "mentorId", "userId","shortBio", goals`,
        [roleId, userId, username, shortBio, goals]
      );
      console.log("Inserted mentor:", mentorResult.rows[0]);
    } else if (role === "mentee") {
      console.log("Inserting into mentees table");
      const menteeResult = await pool.query(
        `INSERT INTO mentees ("menteeId", "userId", username, "shortBio", goals) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "menteeId", "userId","shortBio", goals`,
        [roleId, userId, username, shortBio, goals]
      );
      console.log("Inserted mentee:", menteeResult.rows[0]);
    } else if (role === "admin") {
      console.log("Inserting into admins table");
      const adminResult = await pool.query(
        `INSERT INTO admins ("adminId", "userId", username, "shortBio", goals) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "adminId", "userId", "shortBio", goals`,
        [roleId, userId, username, shortBio, goals]
      );
      console.log("Inserted admin:", adminResult.rows[0]);
    }
    console.log("Role-specific insertion completed");

    console.log("Committing transaction");
    await pool.query("COMMIT");
    console.log("Transaction committed");

    console.log("Sending 201 response with user data");
    return res.status(201).json({
      message: "User added successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Error adding user:", err);
    console.log("Sending 500 response for error");
    return res.status(500).json({ error: "Server error adding user." });
  }
};
console.log("Exported addUser function");

export const editUser = async (req: Request, res: Response) => {
  console.log("Entering editUser function");
  console.log("Destructuring req.params");
  const { id } = req.params;
  console.log("User ID:", id);
  console.log("Destructuring req.body");
  const { username, email, password, role } = req.body;
  console.log("Request body:", { username, email, password, role });

  console.log("Validating user ID");
  if (!id) {
    console.log("User ID is required");
    return res.status(400).json({ error: "User ID is required." });
  }
  console.log("User ID validated");

  try {
    console.log("Checking if user exists");
    const existing = await pool.query(`SELECT * FROM users WHERE id = $1`, [
      id,
    ]);
    console.log("Existing user query result:", existing.rows);
    if (existing.rowCount === 0) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found." });
    }
    console.log("User found");

    console.log("Initializing fields to update");
    const fieldsToUpdate: string[] = [];
    console.log("Fields to update:", fieldsToUpdate);
    console.log("Initializing values array");
    const values: any[] = [];
    console.log("Values array:", values);
    console.log("Initializing parameter index");
    let i = 1;
    console.log("Parameter index:", i);

    if (username) {
      console.log("Adding username to update fields");
      fieldsToUpdate.push(`username = $${i++}`);
      values.push(username);
      console.log("Updated fields and values:", { fieldsToUpdate, values });
    }
    if (email) {
      console.log("Adding email to update fields");
      fieldsToUpdate.push(`email = $${i++}`);
      values.push(email);
      console.log("Updated fields and values:", { fieldsToUpdate, values });
    }
    if (password) {
      console.log("Adding password to update fields");
      fieldsToUpdate.push(`"passwordHash" = $${i++}`);
      values.push(password);
      console.log("Updated fields and values:", { fieldsToUpdate, values });
    }
    if (role) {
      console.log("Validating role");
      const validRoles = ["admin", "mentor", "mentee"];
      console.log("Valid roles:", validRoles);
      if (!validRoles.includes(role)) {
        console.log("Invalid role");
        return res.status(400).json({ error: "Invalid role." });
      }
      console.log("Role validated");
      console.log("Adding role to update fields");
      fieldsToUpdate.push(`role = $${i++}`);
      values.push(role);
      console.log("Updated fields and values:", { fieldsToUpdate, values });
    }

    console.log("Checking if there are fields to update");
    if (fieldsToUpdate.length === 0) {
      console.log("No fields provided to update");
      return res.status(400).json({ error: "No fields provided to update." });
    }
    console.log("Fields to update exist");

    console.log("Adding user ID to values");
    values.push(id);
    console.log("Updated values:", values);

    console.log("Constructing update query");
    const query = `
      UPDATE users
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, username, email, role
    `;
    console.log("Query:", query);

    console.log("Executing update query");
    const { rows } = await pool.query(query, values);
    console.log("Query result:", rows);

    console.log("Sending 200 response with updated user");
    return res.status(200).json({
      message: "User updated successfully.",
      user: rows[0],
    });
  } catch (err) {
    console.error("Error updating user:", err);
    console.log("Sending 500 response for error");
    return res.status(500).json({ error: "Server error updating user." });
  }
};
console.log("Exported editUser function");

export const getUserById = async (req: Request, res: Response) => {
  console.log("Entering getUserById function");
  try {
    console.log("Destructuring req.params");
    const { id } = req.params;
    console.log("User ID:", id);

    console.log("Validating user ID");
    if (!id) {
      console.log("User ID is required");
      res.status(400).json({ error: "User ID is required." });
      console.log("Sent 400 response");
      return;
    }
    console.log("User ID validated");

    console.log("Executing query to fetch user");
    const { rows } = await pool.query(`SELECT * FROM users WHERE "id" = $1`, [
      id,
    ]);
    console.log("Query result:", rows);

    console.log("Checking if user exists");
    if (rows.length === 0) {
      console.log("User not found");
      res.status(404).json({ error: "User not found." });
      console.log("Sent 404 response");
      return;
    }
    console.log("User found");

    console.log("Sending 200 response with user data");
    res.status(200).json(rows[0]);
    console.log("Response sent");
    return;
  } catch (error) {
    console.error("Error fetching user:", error);
    console.log("Sending 500 response for error");
    res.status(500).json({ error: "Internal Server Error" });
    console.log("Error response sent");
  }
};
console.log("Exported getUserById function");