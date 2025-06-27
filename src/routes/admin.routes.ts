import express from "express";
import {
  getAllUsers,
  getAllMentorshipMatches,
  getSessionStats,
  assignMentor,
} from "../controllers/admin.controller/admin.controller";
import { authenticateUser } from "../middlewares/userauth.middleware";
import { adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/assign-mentor", authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(assignMentor(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});

router.get(
  "/mentorship-match",
  authenticateUser,
  adminOnly,
  (req, res, next) => {
    Promise.resolve(getAllMentorshipMatches(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

router.get(
  "/mentorship/sessions",
  authenticateUser,
  adminOnly,
  (req, res, next) => {
    Promise.resolve(getSessionStats(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

router.get("/users", authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(getAllUsers(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});

export default router;
