import express, { type Router as RouterType } from 'express'
import {
  getAllUsers,
  getAllMentorshipMatches,
  getSessionStats,
  assignMentorToMentee,
  getAdminById,
  getAllSessions,
  addUser,
  editUser,
  getUserById,
  getTotalSessionsHeld
} from '../controllers/admin.controller/admin.controller'
import { authenticateUser } from '../middlewares/userauth.middleware'
import { adminOnly } from '../middlewares/auth.middleware'

const router: RouterType = express.Router()

router.get('/user/:id', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(getAdminById(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})

// route for admin to assign mentor
router.post('/assign-mentor', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(assignMentorToMentee(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})

// route for admin to get match for mentorship
router.get(
  '/mentorship-match',
  authenticateUser,
  adminOnly,
  (req, res, next) => {
    Promise.resolve(getAllMentorshipMatches(req, res))
      .then(result => {
        if (result !== undefined) return
      })
      .catch(next)
  }
)

//route to get sessions for mentorship
router.get(
  '/mentorship/sessions',
  authenticateUser,
  adminOnly,
  (req, res, next) => {
    Promise.resolve(getSessionStats(req, res))
      .then(result => {
        if (result !== undefined) return
      })
      .catch(next)
  }
)
router.get('/total-sessions', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(getTotalSessionsHeld(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})

// route to get all users
router.get('/users', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(getAllUsers(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})

export default router

router.get('/sessions', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(getAllSessions(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})
router.post('/add-user', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(addUser(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})
router.put('/users/:id/role', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(editUser(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})
router.get('/user/:id', authenticateUser, adminOnly, (req, res, next) => {
  Promise.resolve(getUserById(req, res))
    .then(result => {
      if (result !== undefined) return
    })
    .catch(next)
})
