import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { loginUser, refreshUserSession, logoutUserSession} from "../services/auth.service.js";

const refreshCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/api/auth",
    };
};

const login = asyncHandler(async (req, res) => {
    const {
        user,
        accessToken,
        refreshToken,
        refreshTokenExpiresAt,
    } = await loginUser(req.body);

    res.cookie("refreshToken", refreshToken, {
        ...refreshCookieOptions(),
        expires: refreshTokenExpiresAt,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { user, accessToken },
            "Login successful"
        )
    );
});

const refreshTokens = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        throw new ApiError(401, "Refresh token is missing");
    }

    const {
        user,
        accessToken,
        refreshToken,
        refreshTokenExpiresAt,
    } = await refreshUserSession(token);

    res.cookie("refreshToken", refreshToken, {
        ...refreshCookieOptions(),
        expires: refreshTokenExpiresAt,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { user, accessToken },
            "Session refreshed successfully"
        )
    );
});

const logout = asyncHandler(async (req, res) => {
    await logoutUserSession(req.cookies?.refreshToken);

    res.clearCookie("refreshToken", refreshCookieOptions());

    return res.status(200).json(
        new ApiResponse(200, null, "Logged out successfully")
    );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            { user: req.user },
            "User fetched successfully"
        )
    );
});

export { login, refreshTokens, logout, getCurrentUser };