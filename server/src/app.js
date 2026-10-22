import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import authorRoutes from "./routes/author.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import { apiLimiter } from "./middlewares/rateLimit.middleware.js";

const app = express();

app.use(helmet());

app.use(
    cors({
        origin:
            process.env.CLIENT_URL?.split(",") ||
            "http://localhost:5173",
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// General API rate limiting.
// Login and refresh are excluded by rateLimit.middleware.js
// and will have their own dedicated limits in auth.routes.js.
app.use("/api", apiLimiter);

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "BookLeaf API is running",
    });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/author", authorRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;

    if (statusCode >= 500) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again later.",
        });
    }

    return res.status(statusCode).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

export default app;