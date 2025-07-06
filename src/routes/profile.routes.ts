import express from "express";
import { completeUserProfiles } from "../controllers/profile.controller/profile.controller";
import { authenticateUser } from "../middlewares/userauth.middleware";
import { jointRoles } from "../middlewares/jointRoles";

const router = express.Router();

function asyncHandler(fn: any) {
  return function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

router.put(
  "/me",
  authenticateUser,
  jointRoles("mentor", "mentee", "admin"),
  asyncHandler(completeUserProfiles)
);

export default router;
