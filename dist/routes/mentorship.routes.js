"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mentorship_controller_1 = require("../controllers/mentorship.controller/mentorship.controller");
const userauth_middleware_1 = require("../middlewares/userauth.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// USER INFO
router.get("/mentor/users/:id", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getMentorById)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get("/mentee/users/:id", userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getMenteeById)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// MENTOR LISTING & ASSIGNMENT
router.get("/mentors", userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, mentorship_controller_1.getMentors);
router.get("/requests/received", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getAssignedMentees)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// MENTORSHIP REQUEST FLOW
router.post("/requests", userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.createRequest)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get("/incoming/:mentorId", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.listIncomingRequests)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.post("/requests/:id", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.respondToRequest)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get("/requests/sent", userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getMenteeRequestToMentor)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// AVAILABILITY
router.post("/availability", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.setAvailability)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.delete("/availability", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.clearAvailability)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get("/availability/mentor", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getAvailability)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
// SESSION BOOKING & LISTING
router.post("/sessions", userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.bookSession)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get("/sessions/mentor", userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.listUpcomingSessionsForMentor)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
router.get("/sessions/mentee", userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.listUpcomingSessionsForMentee)(req, res))
        .then((result) => {
        if (result !== undefined)
            return;
    })
        .catch(next);
});
exports.default = router;
//# sourceMappingURL=mentorship.routes.js.map