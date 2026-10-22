import rateLimit from "express-rate-limit";

const commonOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
};

export const apiLimiter = rateLimit({
    ...commonOptions,
    max: 600,

    skip: (req) =>
        req.path === "/auth/login" ||
        req.path === "/auth/refresh",
});

export const loginLimiter = rateLimit({
    ...commonOptions,
    max: 10,
    skipSuccessfulRequests: true,
});

export const refreshLimiter = rateLimit({
    ...commonOptions,
    max: 60,
});