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
  getMentorById,
  clearAvailability,
  getMenteeById,
} from "../controllers/mentorship.controller/mentorship.controller";
import { authenticateUser } from "../middlewares/userauth.middleware";
import { menteeOnly, mentorOnly } from "../middlewares/auth.middleware";

const router = express.Router();

router.get(
  "/mentor/info/:mentorId",
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(getMentorById(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);
router.get(
  "/mentee/info/:mentorId",
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(getMenteeById(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

router.get("/mentors", authenticateUser, menteeOnly, getMentors);

router.post("/request", authenticateUser, menteeOnly, (req, res, next) => {
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
  (req, res, next) => {
    Promise.resolve(listIncomingRequests(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);
router.post(
  "/requests/respond/:requestId",
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(respondToRequest(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

export default router;

router.post("/availability", authenticateUser, mentorOnly, (req, res, next) => {
  Promise.resolve(setAvailability(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});
router.delete(
  "/availability",
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(clearAvailability(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

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
