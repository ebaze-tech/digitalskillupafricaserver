import express, { type Router as RouterType } from 'express'
import {
  getUserProfile,
  updateUserProfile
} from '../controllers/profile.controller/profile.controller'
import { authenticateUser } from '../middlewares/userauth.middleware'
import { jointRoles } from '../middlewares/jointRoles'

export const router: RouterType = express.Router()

function asyncHandler (fn: any) {
  return function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

router.put(
  '/profile',
  authenticateUser,
  jointRoles('mentor', 'mentee', 'admin'),
  asyncHandler(updateUserProfile)
)

router.get(
  '/profile',
  authenticateUser,
  jointRoles('mentor', 'mentee'),
  asyncHandler(getUserProfile)
)
