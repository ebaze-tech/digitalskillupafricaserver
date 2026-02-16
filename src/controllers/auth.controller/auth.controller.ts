import { Request, Response } from "express";
console.log("Importing Request and Response from express");
import bcrypt from "bcrypt";
console.log("Importing bcrypt");
import jwt from "jsonwebtoken";
console.log("Importing jwt");
import { v4 as uuidv4 } from "uuid";
console.log("Importing v4 as uuidv4 from uuid");
import { pool } from "../../config/db.config";
console.log("Importing pool from db.config");
import sendResetEmail from "../../utils/mailer";
console.log("Importing sendResetEmail from mailer");

const JWT_SECRET = process.env.JWT_SECRET!;
console.log("Initialized JWT_SECRET:", JWT_SECRET);
const CLIENT_URL = process.env.CLIENT_URL;
console.log("Initialized CLIENT_URL:", CLIENT_URL);

export const register = async (req: Request, res: Response): Promise<void> => {
  console.log("Entering register function");
  console.log("Destructuring req.body");
  const {
    username,
    email,
    password,
    role,
    shortBio = "",
    goals = "",
  } = req.body;
  console.log("Request body:", { username, email, password, role, shortBio, goals });

  console.log("Validating required fields");
  if (!username || !email || !password || !role) {
    console.log("Missing required fields");
    res.status(400).json({ message: "All fields are required" });
    console.log("Sent 400 response");
    return;
  }
  console.log("Required fields validated");

  console.log("Validating role");
  const validRoles = ["mentor", "mentee", "admin"];
  console.log("Valid roles:", validRoles);
  if (!validRoles.includes(role)) {
    console.log("Invalid role:", role);
    res.status(400).json({ message: "Invalid role" });
    console.log("Sent 400 response");
    return;
  }
  console.log("Role validated");

  console.log("Logging registration details:", { username, email, role, shortBio, goals });
  console.log("Registering:", { username, email, role, shortBio, goals });

  console.log("Connecting to database client");
  const client = await pool.connect();
  console.log("Database client connected");

  try {
    console.log("Beginning transaction");
    await client.query("BEGIN");
    console.log("Transaction started");

    console.log("Checking for existing email");
    const existing = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    console.log("Existing email query result:", existing.rows);
    if (existing.rows.length > 0) {
      console.log("Email already in use:", email);
      await client.query("ROLLBACK");
      console.log("Transaction rolled back due to existing email");
      res.status(400).json({ message: "Email already in use" });
      console.log("Sent 400 response");
      return;
    }
    console.log("No existing email found");

    console.log("Hashing password");
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Hashed password:", hashedPassword);

    console.log("Generating userId");
    const userId = uuidv4();
    console.log("Generated userId:", userId);

    console.log("Inserting user into users table");
    const userResult = await client.query(
      `INSERT INTO users (id, username, email, "passwordHash", role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, username, email, hashedPassword, role]
    );
    console.log("Inserted user:", { userId: userResult.rows[0].id });

    console.log("Generating roleId");
    const roleId = uuidv4();
    console.log("Generated roleId:", roleId);

    if (role === "mentor") {
      console.log("Inserting into mentors table");
      const mentorResult = await client.query(
        `INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "mentorId", "userId"`,
        [roleId, userId, shortBio, goals, username]
      );
      console.log("Inserted mentor:", mentorResult.rows[0]);
    } else if (role === "mentee") {
      console.log("Inserting into mentees table");
      const menteeResult = await client.query(
        `INSERT INTO mentees ("menteeId", "userId", "shortBio", goals, username) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "menteeId", "userId"`,
        [roleId, userId, shortBio, goals, username]
      );
      console.log("Inserted mentee:", menteeResult.rows[0]);
    } else if (role === "admin") {
      console.log("Inserting into admins table");
      const adminResult = await client.query(
        `INSERT INTO admins ("adminId", "userId", "shortBio", goals, username) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "adminId", "userId"`,
        [roleId, userId, shortBio, goals, username]
      );
      console.log("Inserted admin:", adminResult.rows[0]);
    }
    console.log("Role-specific table insertion completed");

    console.log("Committing transaction");
    await client.query("COMMIT");
    console.log("Transaction committed");

    console.log("Sending 201 response");
    res.status(201).json({
      message: `${role} registered successfully`,
      user: {
        id: userId,
        username,
        email,
        role,
      },
    });
    console.log("Response sent");
  } catch (err) {
    console.log("Caught error in try block");
    await client.query("ROLLBACK");
    console.log("Transaction rolled back due to error");
    console.error("Registration error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log("Error message:", errorMessage);
    res.status(500).json({ message: "Server error", error: errorMessage });
    console.log("Sent 500 response");
  } finally {
    console.log("Releasing database client");
    client.release();
    console.log("Database client released");
  }
};
console.log("Exported register function");

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log("Entering login function");
  console.log("Destructuring req.body");
  const { email, password } = req.body;
  console.log("Request body:", { email, password });

  console.log("Validating required fields");
  if (!email || !password) {
    console.log("Missing required fields");
    res.status(400).json({ message: "All fields are required." });
    console.log("Sent 400 response");
    return;
  }
  console.log("Required fields validated");

  try {
    console.log("Executing query to fetch user");
    const result = await pool.query(
      'SELECT id, email, role, "passwordHash", "shortBio", username, goals, industry, experience, availability, skills::text[] AS skills FROM users WHERE email = $1',
      [email]
    );
    console.log("Query result:", result);

    console.log("Retrieving user from query result");
    const user = result.rows[0];
    console.log("User:", user);

    if (!user) {
      console.log("User not found");
      res.status(404).json({ message: "User not found" });
      console.log("Sent 404 response");
      return;
    }
    console.log("User found");

    console.log("Comparing password");
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", passwordMatch);

    if (!passwordMatch) {
      console.log("Invalid credentials");
      res.status(401).json({ message: "Invalid credentials" });
      console.log("Sent 401 response");
      return;
    }
    console.log("Password validated");

    console.log("Initializing roleId");
    let roleId: string | undefined;
    console.log("Role ID:", roleId);

    if (user.role === "mentor") {
      console.log("Fetching mentorId");
      const r = await pool.query(
        `SELECT "mentorId" FROM mentors WHERE "userId" = $1`,
        [user.id]
      );
      console.log("Mentor query result:", r.rows);
      roleId = r.rows[0]?.mentorId;
      console.log("Mentor roleId:", roleId);
    } else if (user.role === "mentee") {
      console.log("Fetching menteeId");
      const r = await pool.query(
        `SELECT "menteeId" FROM mentees WHERE "userId" = $1`,
        [user.id]
      );
      console.log("Mentee query result:", r.rows);
      roleId = r.rows[0]?.menteeId;
      console.log("Mentee roleId:", roleId);
    } else if (user.role === "admin") {
      console.log("Fetching adminId");
      const r = await pool.query(
        `SELECT "adminId" FROM admins WHERE "userId" = $1`,
        [user.id]
      );
      console.log("Admin query result:", r.rows);
      roleId = r.rows[0]?.adminId;
      console.log("Admin roleId:", roleId);
    }
    console.log("Role ID fetched:", roleId);

    try {
      console.log("Generating JWT token");
      const token = jwt.sign(
        {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            ...(user.role === "mentor" && { mentorId: roleId }),
            ...(user.role === "mentee" && { menteeId: roleId }),
            ...(user.role === "admin" && { adminId: roleId }),
          },
          skills: user.skills,
          shortBio: user.shortBio,
          goals: user.goals,
          industry: user.industry,
          experience: user.experience,
          availability: user.availability,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );
      console.log("Generated token:", token);
      console.log("User data for response:", user);
      console.log("User details:", {
        username: user.username,
        shortBio: user.shortBio,
        skills: user.skills,
        goals: user.goals,
        role: user.role,
      });

      console.log("Sending 200 response with token and user data");
      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          roleId,
          skills: user.skills,
          shortBio: user.shortBio,
          goals: user.goals,
          industry: user.industry,
          experience: user.experience,
          availability: user.availability,
        },
      });
      console.log("Response sent");

      return;
    } catch (error) {
      console.error("JWT sign error:", error);
      console.log("Sending 500 response for JWT error");
      res.status(500).json({ message: "Token generation failed." });
      console.log("Sent 500 response");
      return;
    }
  } catch (error: any) {
    console.error("Login error:", error.message);
    console.log("Sending 500 response for error");
    res.status(500).json({ message: "Server error", error });
    console.log("Error response sent");
  }
};
console.log("Exported login function");

export const forgotPassword = async (req: Request, res: Response) => {
  console.log("Entering forgotPassword function");
  console.log("Destructuring req.body");
  const { email } = req.body;
  console.log("Email:", email);

  console.log("Validating email");
  if (!email) {
    console.log("Email is required");
    res.status(400).json({ message: "Email is required" });
    console.log("Sent 400 response");
    return;
  }
  console.log("Email validated");

  try {
    console.log("Querying user by email");
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    console.log("User query result:", userResult.rows);

    console.log("Retrieving user");
    const user = userResult.rows[0];
    console.log("User:", user);

    if (!user) {
      console.log("User not found");
      res.status(404).json({ message: "User not found" });
      console.log("Sent 404 response");
      return;
    }
    console.log("User found");

    console.log("Generating reset token");
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "10m",
    });
    console.log("Generated reset token:", token);

    console.log("Generating reset link");
    const resetLink = `${CLIENT_URL}/reset-password/${token}`;
    console.log("Reset link:", resetLink);

    console.log("Sending reset email");
    await sendResetEmail(email, resetLink);
    console.log("Reset email sent");

    console.log("Sending response");
    res.json({ message: "Reset link sent to email." });
    console.log("Response sent");
    return;
  } catch (err) {
    console.error("Forgot password error:", err);
    console.log("Sending 500 response for error");
    res.status(500).json({ message: "Something went wrong." });
    console.log("Error response sent");
    return;
  }
};
console.log("Exported forgotPassword function");

export const resetPassword = async (req: Request, res: Response) => {
  console.log("Entering resetPassword function");
  console.log("Destructuring req.body");
  const { token, newPassword } = req.body;
  console.log("Request body:", { token, newPassword });

  console.log("Validating input");
  if (!token || !newPassword) {
    console.log("Invalid input");
    res.status(400).json({ message: "Invalid input" });
    console.log("Sent 400 response");
    return;
  }
  console.log("Input validated");

  try {
    console.log("Verifying JWT token");
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    console.log("Decoded token:", decoded);

    console.log("Hashing new password");
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log("Hashed new password:", hashedPassword);

    console.log("Updating user password");
    await pool.query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [
      hashedPassword,
      decoded.userId,
    ]);
    console.log("Password updated");

    console.log("Sending response");
    res.json({ message: "Password has been reset successfully." });
    console.log("Response sent");
    return;
  } catch (err) {
    console.error("Reset password error:", err);
    console.log("Sending 400 response for invalid or expired token");
    res.status(400).json({ message: "Invalid or expired token." });
    console.log("Error response sent");
    return;
  }
};
console.log("Exported resetPassword function");