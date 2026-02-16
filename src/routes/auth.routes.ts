import express, { type Router as RouterType } from 'express'

import {
  register,
  login,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller/auth.controller'
import { validateRegister } from '../middlewares/validator'

const router: RouterType = express.Router()
router.post('/register', validateRegister, register)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)

export default router
