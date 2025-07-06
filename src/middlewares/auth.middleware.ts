import { RequestHandler } from "express";

const requireRole = (role: "admin" | "mentor" | "mentee"): RequestHandler => {
  return (req, res, next): void => {
    const user = req.user;

    if (!user?.role) {
      res.status(401).json({ message: "Unauthorized: No role found" });
      return;
    }

    if (user.role !== role) {
      res.status(403).json({ message: `Forbidden: Only ${role}s allowed` });
      return;
    }

    next();
  };
};

export const getAuthenticatedUser: RequestHandler = (req, res): void => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized: No user found" });
    return;
  }

  res.json({ user: req.user });
};

// Dedicated middlewares
export const adminOnly: RequestHandler = requireRole("admin");
export const mentorOnly: RequestHandler = requireRole("mentor");
export const menteeOnly: RequestHandler = requireRole("mentee");

