import { randomUUID } from "node:crypto";
import { prisma } from "../db/prisma.js";
import {ApiError} from "../utils/api-error.js";
import { comparePassword } from "../utils/password.utils.js";
import {generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken, getTokenExpiry } from "../utils/token.utils.js";

const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: {
            email: email.trim().toLowerCase(),
        },
    })

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await comparePassword(
        password,
        user.passwordHash
    );
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid email or password");
    }

    const sessionId = randomUUID();

    const accessToken = generateAccessToken(user.id, sessionId);
    const refreshToken = generateRefreshToken(user.id, sessionId);
    const expiresAt = getTokenExpiry(refreshToken);

    await prisma.authSession.create({
        data: {
            id: sessionId,
            userId: user.id,
            refreshTokenHash: hashToken(refreshToken),
            expiresAt,
        },
    });

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,
        refreshToken,
        refreshTokenExpiresAt: expiresAt,
    };
};

const refreshUserSession = async (token) => {
    let decoded;

    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new Error(401, "Refresh token expired. Please log in again");
        }

        if (
            error.name === "JsonWebToeknError" ||
            error.name === "NotBeforeError"
        ) {
            throw new Error(401, "Invalid refresh token");
        }

        throw error;
    }

    if (
        !decoded ||
        typeof decoded !== "object" ||
        typeof decoded.sub !== "string" ||
        typeof decoded.sid !== "string"
    ) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const session = await prisma.authSession.findUnique({
        where: { id: decoded.sid },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });

    if (
        !session ||
        session.userId !== decoded.sub || 
        session.revokedAt ||
        session.expiresAt <= new Date() ||
        !session.user
    ) {
        throw new Error(401, "Session is invalid or expired");
    }

    const currentHash = hashToken(token);

    if (session.refreshTokenHash !== currentHash) {
        await prisma.authSession.updateMany({
            where: {
                id: session.id,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
        throw new ApiError(
            401, "Refresh token reuse detected. Please log in again"
        );
    }

    const refreshToken = generateRefreshToken(session.userId, session.id);
    const refreshTokenExpiresAt = getTokenExpiry(refreshToken);

    const result = await prisma.authSession.updateMany({
        where: {
            id: session.id,
            userId: session.userId,
            refreshTokenHash: currentHash,
            revokedAt: null,
            expiresAt: { gt: new Date() },
        },
        data: {
            refreshTokenHash: hashToken(refreshToken),
            expiresAt: refreshTokenExpiresAt,
        },
    });

    if (result.count !== 1) {
        throw new ApiError(401, "Refresh token is no longer valid");
    }

    return {
        user: session.user,
        accessToken: generateAccessToken(session.userId, session.id),
        refreshToken,
        refreshTokenExpiresAt,
    };
}

const logoutUserSession = async (token) => {
    if (!token) return;

    let decoded;

    try {
        decoded = verifyRefreshToken(token);
    } catch (error) {
        if (
            error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {
            return;
        }

        throw error;
    }

    if (
        !decoded ||
        typeof decoded !== "object" ||
        typeof decoded.sub !== "string" ||
        typeof decoded.sid !== "string"
    ) {
        return;
    }

    await prisma.authSession.updateMany({
        where: {
            id: decoded.sid,
            userId: decoded.sub,
            refreshTokenHash: hashToken(token),
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
};

export { loginUser, refreshUserSession, logoutUserSession };