import express, { type Router as RouterType } from 'express'
import { getAuthenticatedUser } from "../middlewares/auth.middleware";

const router:RouterType = express.Router();

router.get("/auth/me", getAuthenticatedUser);

export default router;
