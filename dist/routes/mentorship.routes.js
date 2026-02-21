"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const mentorship_controller_1 = require("../controllers/mentorship.controller/mentorship.controller");
const userauth_middleware_1 = require("../middlewares/userauth.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
exports.router = express_1.default.Router();
/* =====================================================
   MENTORS
===================================================== */
// List all mentors
exports.router.get('/mentors', userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, mentorship_controller_1.getMentors);
// Get mentor profile
exports.router.get('/mentors/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getMentorById)(req, res)).catch(next);
});
/* =====================================================
   MENTEES
===================================================== */
// Get mentee profile
exports.router.get('/mentees/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getMenteeById)(req, res)).catch(next);
});
/* =====================================================
   MENTORSHIP REQUESTS
===================================================== */
// Create mentorship request
exports.router.post('/mentorship-requests', userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.createRequest)(req, res)).catch(next);
});
// Get requests sent by mentee
exports.router.get('/mentorship-requests/sent', userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getMenteeRequestToMentor)(req, res)).catch(next);
});
// Get requests received by mentor
exports.router.get('/mentorship-requests/received', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getAssignedMentees)(req, res)).catch(next);
});
// Respond to mentorship request
exports.router.patch('/mentorship-requests/:id', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.respondToRequest)(req, res)).catch(next);
});
/* =====================================================
   SESSIONS
===================================================== */
// Book a session
exports.router.post('/sessions', userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.bookSession)(req, res)).catch(next);
});
// Get upcoming sessions for mentee
exports.router.get('/mentees/me/sessions/upcoming', userauth_middleware_1.authenticateUser, auth_middleware_1.menteeOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.listUpcomingSessionsForMentee)(req, res)).catch(next);
});
// Get upcoming sessions for mentor
exports.router.get('/mentors/me/sessions/upcoming', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.listUpcomingSessionsForMentor)(req, res)).catch(next);
});
/* =====================================================
   AVAILABILITY
===================================================== */
// Set availability
exports.router.post('/mentors/me/availability', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.setAvailability)(req, res)).catch(next);
});
// Get availability
exports.router.get('/mentors/me/availability', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.getAvailability)(req, res)).catch(next);
});
// Clear availability
exports.router.delete('/mentors/me/availability', userauth_middleware_1.authenticateUser, auth_middleware_1.mentorOnly, (req, res, next) => {
    Promise.resolve((0, mentorship_controller_1.clearAvailability)(req, res)).catch(next);
});
//# sourceMappingURL=mentorship.routes.js.map