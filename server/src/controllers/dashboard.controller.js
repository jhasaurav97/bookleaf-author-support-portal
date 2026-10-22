import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getAuthorDashboardSummary, getAdminDashboardSummary } from "../services/dashboard.service.js";

const getAuthorDashboardController = asyncHandler(async (req, res) => {
    const summary = await getAuthorDashboardSummary(req.user.id);
    return res.status(200).json(
        new ApiResponse(200, summary, "Author dashboard summary fetched successfully")
    );
});

const getAdminDashboardController = asyncHandler(async (req, res) => {
    const summary = await getAdminDashboardSummary();
    return res.status(200).json(
        new ApiResponse(200, summary, "Admin dashboard summary fetched successfully")
    );
});

export { getAuthorDashboardController, getAdminDashboardController };
