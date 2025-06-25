import { RequestHandler } from "express";

export const checkRole = (
  ...allowedRoles: Array<"admin" | "mentor" | "mentee">
): RequestHandler => {
  return (req, res, next) => {
    const user = req.user;

    if (!user?.role) {
      res
        .status(401)
        .json({ message: "Unauthorized: No user role found" });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({ message: "Forbidden: Access denied." });
      return;
    }

    next();
  };
};
