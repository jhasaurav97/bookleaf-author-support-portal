import { Router } from "express";

import {
    login,
    refreshTokens,
    logout,
    getCurrentUser,
} from "../controllers/auth.controller.js";

import { loginSchema } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    loginLimiter,
    refreshLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Login: rate-limit attempts before validating credentials.
router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    login
);

// Refresh: use its own rate limit, separate from login.
router.post(
    "/refresh",
    refreshLimiter,
    refreshTokens
);

// Logout
router.post("/logout", logout);

// Current authenticated user
router.get("/me", verifyJWT, getCurrentUser);

export default router;