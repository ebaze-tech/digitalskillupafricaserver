import express from "express";
import {
  createRequest,
  listIncomingRequests,
  respondToRequest,
  getMentors,
  setAvailability,
  getAvailability,
  bookSession,
  listUpcomingSessions,
} from "../controllers/mentorship.controller/mentorship.controller";
import { authenticateUser } from "../middlewares/userauth.middleware";
import { menteeOnly, mentorOnly } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", authenticateUser, menteeOnly, getMentors);
router.post("/", authenticateUser, mentorOnly, (req, res, next) => {
  Promise.resolve(createRequest(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});
router.get(
  "/incoming/:mentorId",
  authenticateUser,
  mentorOnly,
  listIncomingRequests
);
router.patch("/:id", authenticateUser, mentorOnly, (req, res, next) => {
  Promise.resolve(respondToRequest(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});

export default router;

router.post("/availability", authenticateUser, mentorOnly, (req, res, next) => {
  Promise.resolve(setAvailability(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});

router.get(
  "/availability/mentor",
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(getAvailability(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

router.post(
  "/book-session/:mentorId",
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(bookSession(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

router.get(
  "/book-session/all",
  authenticateUser,
  menteeOnly || mentorOnly,
  (req, res, next) => {
    Promise.resolve(listUpcomingSessions(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);
