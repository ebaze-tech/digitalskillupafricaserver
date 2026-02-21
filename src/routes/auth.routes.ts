import express, { type Router as RouterType } from 'express'

import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyToken,
  refreshToken
} from '../controllers/auth.controller/auth.controller'
import { validateRegister } from '../middlewares/validator'
import { authenticateUser } from '../middlewares/userauth.middleware'

export const router: RouterType = express.Router()

router.post('/register', validateRegister, register)
router.post('/login', login)
router.get('/verify-token', authenticateUser, verifyToken)
router.post('/refresh-token', authenticateUser, refreshToken)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
