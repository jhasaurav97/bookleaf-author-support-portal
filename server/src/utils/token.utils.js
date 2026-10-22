import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "./api-error.js";

const getSecret = (key) => {
    const secret = process.env[key];

    if (!secret) {
        throw new ApiError(500, `${key} is not configured`);
    }

    return secret;
}

const generateAccessToken = (userId, sessionId) => {
    return jwt.sign(
        {
            sub: userId,
            sid: sessionId,
        },
        getSecret("ACCESS_TOKEN_SECRET"),
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m",
        }
    );
};

const generateRefreshToken = (userId, sessionId) => {
    return jwt.sign(
        {
            sub: userId,
            sid: sessionId,
            jti: randomUUID,
        },
        getSecret("REFRESH_TOKEN_SECRET"),
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
        }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, getSecret("ACCESS_TOKEN_SECRET"));
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, getSecret("REFRESH_TOKEN_SECRET"));
};

const hashToken = (token) => {
    return createHash("sha256").update(token).digest("hex");
};

const getTokenExpiry = (token) => {
    const decoded = jwt.decode(token);

    if (
        !decoded ||
        typeof decoded !== "object" ||
        typeof decoded.exp !== "number"
    ) {
        throw new ApiError(500, "Could not determine token expiry");
    }

    return new Date(decoded.exp * 1000);
};

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    hashToken,
    getTokenExpiry
};