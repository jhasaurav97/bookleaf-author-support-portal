import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { getAuthorDashboardController, getAdminDashboardController } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/author", verifyJWT, authorizeRoles("AUTHOR"), getAuthorDashboardController);
router.get("/admin", verifyJWT, authorizeRoles("ADMIN"), getAdminDashboardController);

export default router;
