import express from "express";
import {
  createRequest,
  listIncomingRequests,
  respondToRequest,
  getMentors,
  setAvailability,
  getAvailability,
  bookSession,
  listUpcomingSessionsForMentor,
  getMentorById,
  clearAvailability,
  getMenteeById,
  getAssignedMentees,
  getMenteeRequestToMentor,
  listUpcomingSessionsForMentee,
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

router.get(
  "/assigned-mentees",
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(getAssignedMentees(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);
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
router.get(
  "/request-to-mentor/",
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(getMenteeRequestToMentor(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

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

router.post("/book-session", authenticateUser, menteeOnly, (req, res, next) => {
  Promise.resolve(bookSession(req, res))
    .then((result) => {
      if (result !== undefined) return;
    })
    .catch(next);
});

router.get(
  "/mentor-upcoming-sessions",
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(listUpcomingSessionsForMentor(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

router.get(
  "/mentee-upcoming-sessions",
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(listUpcomingSessionsForMentee(req, res))
      .then((result) => {
        if (result !== undefined) return;
      })
      .catch(next);
  }
);

export default router;
