import express, { type Router as RouterType } from 'express'
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
  listUpcomingSessionsForMentee
} from '../controllers/mentorship.controller/mentorship.controller'
import { authenticateUser } from '../middlewares/userauth.middleware'
import {
  getAuthenticatedUser,
  menteeOnly,
  mentorOnly
} from '../middlewares/auth.middleware'

export const router: RouterType = express.Router()

/* =====================================================
   MENTORS
===================================================== */

// List all mentors
router.get('/mentors', authenticateUser, menteeOnly, getMentors)

// Get mentor profile
router.get('/mentors/:id', authenticateUser, mentorOnly, (req, res, next) => {
  Promise.resolve(getMentorById(req, res)).catch(next)
})

/* =====================================================
   MENTEES
===================================================== */

// Get mentee profile
router.get('/mentees/:id', authenticateUser, menteeOnly, (req, res, next) => {
  Promise.resolve(getMenteeById(req, res)).catch(next)
})

/* =====================================================
   MENTORSHIP REQUESTS
===================================================== */

// Create mentorship request
router.post(
  '/mentorship-requests',
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(createRequest(req, res)).catch(next)
  }
)

// Get requests sent by mentee
router.get(
  '/mentorship-requests/sent',
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(getMenteeRequestToMentor(req, res)).catch(next)
  }
)

// Get requests received by mentor
router.get(
  '/mentorship-requests/received',
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(getAssignedMentees(req, res)).catch(next)
  }
)

// Respond to mentorship request
router.patch(
  '/mentorship-requests/:id',
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(respondToRequest(req, res)).catch(next)
  }
)

/* =====================================================
   SESSIONS
===================================================== */

// Book a session
router.post('/sessions', authenticateUser, menteeOnly, (req, res, next) => {
  Promise.resolve(bookSession(req, res)).catch(next)
})

// Get upcoming sessions for mentee
router.get(
  '/mentees/me/sessions/upcoming',
  authenticateUser,
  menteeOnly,
  (req, res, next) => {
    Promise.resolve(listUpcomingSessionsForMentee(req, res)).catch(next)
  }
)

// Get upcoming sessions for mentor
router.get(
  '/mentors/me/sessions/upcoming',
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(listUpcomingSessionsForMentor(req, res)).catch(next)
  }
)

/* =====================================================
   AVAILABILITY
===================================================== */

// Set availability
router.post(
  '/mentors/me/availability',
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(setAvailability(req, res)).catch(next)
  }
)

// Get availability
router.get(
  '/mentors/me/availability',
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(getAvailability(req, res)).catch(next)
  }
)

// Clear availability
router.delete(
  '/mentors/me/availability',
  authenticateUser,
  mentorOnly,
  (req, res, next) => {
    Promise.resolve(clearAvailability(req, res)).catch(next)
  }
)
