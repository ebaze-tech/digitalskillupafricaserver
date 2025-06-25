import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import pool from "../../config/db.config";

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    username,
    email,
    password,
    role,
    shortBio = "",
    goals = "",
  } = req.body;

  if (!username || !email || !password || !role) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0) {
      res.status(400).json({ message: "Email already in use" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userId = uuidv4();
    await pool.query(
      `INSERT INTO users (id, username, email, "passwordHash", role) VALUES ($1, $2, $3, $4, $5)`,
      [userId, username, email, hashedPassword, role]
    );

    const roleId = uuidv4();
    if (role === "mentor") {
      await pool.query(
        `INSERT INTO mentors ("mentorId", "userId", "shortBio", goals, username) VALUES ($1, $2, $3, $4, $5)`,
        [roleId, userId, shortBio, goals, username]
      );
    } else if (role === "mentee") {
      await pool.query(
        `INSERT INTO mentees ("menteeId", "userId", "shortBio, goals, username) VALUES ($1, $2, $3, $4, $5)`,
        [roleId, userId, shortBio, goals, username]
      );
    } else if (role === "admin") {
      await pool.query(
        `INSERT INTO admins ("adminId, 'userId', "shortBio, goals) VALUES ($1, $2, $3, $4)`,
        [roleId, userId, shortBio, goals]
      );
    }

    res.status(201).json({
      message: `${role} registered successfully`,
      user: {
        id: userId,
        username,
        email,
        role,
      },
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
    return;
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "All fields are required." });
    return;
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    let roleId: string | undefined;
    if (user.role === "mentor") {
      const r = await pool.query(
        "SELECT 'mentorId' FROM mentors WHERE 'userId' = $1",
        [user.id]
      );
      roleId = r.rows[0]?.mentor_id;
    } else if (user.role === "mentee") {
      const r = await pool.query(
        "SELECT 'menteeId' FROM mentees WHERE 'userId' = $1",
        [user.id]
      );
      roleId = r.rows[0]?.mentee_id;
    } else if (user.role === "admin") {
      const r = await pool.query(
        "SELECT 'adminId' FROM admins WHERE 'userId' = $1",
        [user.id]
      );
      roleId = r.rows[0]?.admin_id;
    }

    const token = jwt.sign(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          roleId,
        },
      },
      JWT_SECRET,
      { expiresIn: "7d" }
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
      },
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
    return;
  }
};

// module.exports = { register, login };
