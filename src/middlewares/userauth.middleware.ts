import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.config";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "admin" | "mentor" | "mentee";
        username: string;
        email: string;
        mentorId?: string;
        menteeId?: string;
        adminId?: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      user: {
        id: string | number;
        role: "admin" | "mentor" | "mentee";
        username: string;
        email: string;
        mentorId: string;
        menteeId: string;
        adminId: string;
      };
    };

    const user = {
      ...decoded.user,
      id: String(decoded.user.id),
    };

    if (user.role === "mentor") {
      const result = await pool.query(
        `SELECT "mentorId" FROM mentors WHERE "userId" = $1`,
        [user.id]
      );
      if (result.rows.length > 0) {
        user.mentorId = result.rows[0].mentorId;
      }
    } else if (user.role === "mentee") {
      const result = await pool.query(
        `SELECT "menteeId" FROM mentees WHERE "userId" = $1`,
        [user.id]
      );
      if (result.rows.length > 0) {
        user.menteeId = result.rows[0].menteeId;
      }
    } else if (user.role === "admin") {
      const result = await pool.query(
        `SELECT "adminId" FROM admins WHERE "userId" = $1`,
        [user.id]
      );
      if (result.rows.length > 0) {
        user.mentorId = result.rows[0].mentorId;
      }
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};
