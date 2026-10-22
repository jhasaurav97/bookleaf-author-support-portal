import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { getAuthorBooks } from "../controllers/author.controller.js";

const router = Router();

router.get("/books", verifyJWT, authorizeRoles("AUTHOR"), getAuthorBooks);

export default router;