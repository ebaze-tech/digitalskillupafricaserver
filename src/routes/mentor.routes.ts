import express from "express";
import {
  createRequest,
  listIncomingRequests,
  respondToRequest,
  getMentors,
} from "../controllers/mentorship.controller/mentorship.controller";
import { authenticateUser } from "../middlewares/userauth.middleware";
import { checkRole } from "../middlewares/auth.middleware";

const router = express.Router();

router.get(
  "/",
  authenticateUser,
  checkRole("admin", "mentor", "mentee"),
  getMentors
);
router.post(
  "/",
  authenticateUser,
  checkRole("admin", "mentor", "mentee"),
  (req, res, next) => {
    Promise.resolve(createRequest(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);
router.get(
  "/incoming/:mentorId",
  authenticateUser,
  checkRole("admin", "mentor", "mentee"),
  listIncomingRequests
);
router.patch(
  "/:id",
  authenticateUser,
  checkRole("admin", "mentor", "mentee"),
  (req, res, next) => {
    Promise.resolve(respondToRequest(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

export default router;
