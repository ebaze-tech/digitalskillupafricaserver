import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: "admin" | "mentor" | "mentee";
        username: string;
        email: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      user: {
        id: string;
        role: "admin" | "mentor" | "mentee";
        username: string;
        email: string;
      };
    };

    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ message: "Invalid token" });
  }
};
