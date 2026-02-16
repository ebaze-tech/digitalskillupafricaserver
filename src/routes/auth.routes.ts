import express, { type Router as RouterType } from 'express'

import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller/auth.controller";

const router:RouterType = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
