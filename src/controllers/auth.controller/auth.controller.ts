import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../../config/db.config";
import sendResetEmail from "../../utils/mailer";

const JWT_SECRET = process.env.JWT_SECRET!;
const CLIENT_URL = process.env.CLIENT_URL;

export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    username,
    email,
    password,
    role,
    shortBio = "",
    goals = "",
  } = req.body;

  // Validate required fields
  if (!username || !email || !password || !role) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  // Validate role
  const validRoles = ["mentor", "mentee", "admin"];
  if (!validRoles.includes(role)) {
    res.status(400).json({ message: "Invalid role" });
    return;
  }

  console.log("Registering:", { username, email, role, shortBio, goals });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check for existing email
    const existing = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      await client.query("ROLLBACK");
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Hashed password:", hashedPassword);

    // Insert user
    const userId = uuidv4();
    const userResult = await client.query(
      `INSERT INTO users (id, username, email, "passwordHash", role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, username, email, hashedPassword, role]
    );
    console.log("Inserted user:", { userId: userResult.rows[0].id });

    // Insert into role-specific table
    const roleId = uuidv4();
    if (role === "mentor") {
      const mentorResult = await client.query(
        `INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "mentorId", "userId"`,
        [roleId, userId, shortBio, goals, username]
      );
      console.log("Inserted mentor:", mentorResult.rows[0]);
    } else if (role === "mentee") {
      const menteeResult = await client.query(
        `INSERT INTO mentees ("menteeId", "userId", "shortBio", goals, username) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "menteeId", "userId"`,
        [roleId, userId, shortBio, goals, username]
      );
      console.log("Inserted mentee:", menteeResult.rows[0]);
    } else if (role === "admin") {
      const adminResult = await client.query(
        `INSERT INTO admins ("adminId", "userId", "shortBio", goals, username) 
         VALUES ($1, $2, $3, $4, $5) RETURNING "adminId", "userId"`,
        [roleId, userId, shortBio, goals, username]
      );
      console.log("Inserted admin:", adminResult.rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: `${role} registered successfully`,
      user: {
        id: userId,
        username,
        email,
        role,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Registration error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  console.log(email, password);

  if (!email || !password) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id, email, role, "passwordHash", "shortBio", username, goals, industry, experience, availability, skills::text[] AS skills FROM users WHERE email = $1',
      [email]
    );

    console.log(result);

    const user = result.rows[0];
    console.log(user);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(passwordMatch);

    if (!passwordMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    let roleId: string | undefined;
    console.log(roleId);

    if (user.role === "mentor") {
      const r = await pool.query(
        `SELECT "mentorId" FROM mentors WHERE "userId" = $1`,
        [user.id]
      );
      roleId = r.rows[0]?.mentorId;
    } else if (user.role === "mentee") {
      const r = await pool.query(
        `SELECT "menteeId" FROM mentees WHERE "userId" = $1`,
        [user.id]
      );
      roleId = r.rows[0]?.menteeId;
    } else if (user.role === "admin") {
      const r = await pool.query(
        `SELECT "adminId" FROM admins WHERE "userId" = $1`,
        [user.id]
      );
      roleId = r.rows[0]?.adminId;
    }

    try {
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
      console.log(token);
      console.log(user);
      console.log(
        user.username,
        user.shortBio,
        user.skills,
        user.goals,
        user.role
      );
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

      return;
    } catch (error) {
      console.error("JWT sign error:", error);
      res.status(500).json({ message: "Token generation failed." });
      return;
    }
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: "Server error", error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ message: "Email is required" });
    return;
  }

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "10m",
    });
    const resetLink = `${CLIENT_URL}/reset-password/${token}`;

    await sendResetEmail(email, resetLink);
    res.json({ message: "Reset link sent to email." });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong." });
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ message: "Invalid input" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.query('UPDATE users SET "passwordHash" = $1 WHERE id = $2', [
      hashedPassword,
      decoded.userId,
    ]);

    res.json({ message: "Password has been reset successfully." });
    return;
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid or expired token." });
    return;
  }
};
