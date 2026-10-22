import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/rbac.middleware.js";
import { validateQuery } from "../middlewares/validate.middleware.js";
import { adminTicketQuerySchema } from "../validators/admin.validator.js";
import { getAdminTicketQueueController, updateAdminTicketController, assignTicketController, addAdminMessageController, getAdminTicketDetailsController } from "../controllers/admin.controller.js";
import { updateAdminTicketSchema, adminMessageSchema} from "../validators/admin.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

import { testGeminiController } from "../controllers/admin.controller.js";

const router = Router();

if (process.env.NODE_ENV !== "production") {
    router.post(
        "/ai-test",
        verifyJWT,
        authorizeRoles("ADMIN"),
        testGeminiController
    );
}

router.get(
    "/tickets",
    verifyJWT,
    authorizeRoles("ADMIN"),
    validateQuery(adminTicketQuerySchema),
    getAdminTicketQueueController
);

router.get(
    "/tickets/:ticketId",
    verifyJWT,
    authorizeRoles("ADMIN"),
    getAdminTicketDetailsController
);

router.patch(
    "/tickets/:ticketId",
    verifyJWT,
    authorizeRoles("ADMIN"),
    validate(updateAdminTicketSchema),
    updateAdminTicketController
);

router.post(
    "/tickets/:ticketId/assign-to-me",
    verifyJWT,
    authorizeRoles("ADMIN"),
    assignTicketController
);

router.post(
    "/tickets/:ticketId/messages",
    verifyJWT,
    authorizeRoles("ADMIN"),
    validate(adminMessageSchema),
    addAdminMessageController
);

export default router;