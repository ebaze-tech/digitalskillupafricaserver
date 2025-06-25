import express from "express";
import { completeUserProfile } from "../controllers/profile.controller/profile.controller";
import { checkRole } from "../middlewares/auth.middleware";
import { authenticateUser } from "../middlewares/userauth.middleware";

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

router.post(
  "/setup",
  authenticateUser,
  checkRole("admin", "mentor", "mentee"),
  asyncHandler(completeUserProfile)
);

export default router;
