import express from "express";
import { getAuthenticatedUser } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/auth/me", getAuthenticatedUser);

export default router;
