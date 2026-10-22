import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { verifyAccessToken } from "../utils/token.utils.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith("Bearer ")) {
        throw new ApiError(401, "Authentication required");
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
        throw new ApiError(401, "Access token is missing");
    }

    let decodedToken;

    try {
        decodedToken = verifyAccessToken(token);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Access token has expired");
        }

        if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
            throw new ApiError(401, "Invalid access token");
        }
        throw error;
    }

    if (
        !decodedToken ||
        typeof decodedToken !== "object" ||
        typeof decodedToken.sub !== "string" ||
        typeof decodedToken.sid !== "string"
    ) {
        throw new ApiError(401, "Invalid access token");
    }

    const session = await prisma.authSession.findFirst({
        where: {
            id: decodedToken.sid,
            userId: decodedToken.sub,
            revokedAt: null,
            expiresAt: {
                gt: new Date(),
            },
        },
        select: {
            id: true,
        },
    });

    if (!session) {
        throw new ApiError(401, "Session is invalid or expired");
    }

    const user = await prisma.user.findUnique({
        where: { id: decodedToken.sub },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        },
    });

    if (!user) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
});

export { verifyJWT };