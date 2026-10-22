import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createTicketSchema } from "../validators/ticket.validator.js";
import { createTicketController, getMyTicketsController, getMyTicketDetailsController } from "../controllers/ticket.controller.js";

const router = Router();

router.post("/", verifyJWT, authorizeRoles("AUTHOR"), validate(createTicketSchema), createTicketController);

router.get("/", verifyJWT, authorizeRoles("AUTHOR"), getMyTicketsController);
router.get("/:ticketId", verifyJWT, authorizeRoles("AUTHOR"), getMyTicketDetailsController);

export default router;