import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getAdminTicketQueue, updateAdminTicket, assignTicketToAdmin, addAdminMessage, getAdminTicketDetails } from "../services/admin.service.js";
import { testGeminiModel } from "../services/ai.service.js";

const getAdminTicketQueueController = asyncHandler(async (req, res) => {
    const result = await getAdminTicketQueue(req.validatedQuery);

    return res.status(200).json(
        new ApiResponse(
            200,
            result,
            "Admin ticket queue fetched successfully"
        )
    );
});

const updateAdminTicketController = asyncHandler(async (req, res) => {
    const ticket = await updateAdminTicket(
        req.params.ticketId,
        req.body
    );

    return res.status(200).json(
        new ApiResponse(200, { ticket }, "Ticket updated successfully")
    );
});

const assignTicketController = asyncHandler(async (req, res) => {
    const ticket = await assignTicketToAdmin(
        req.params.ticketId,
        req.user.id
    );

    return res.status(200).json(
        new ApiResponse(200, { ticket }, "Ticket assigned successfully")
    );
});

const addAdminMessageController = asyncHandler(async (req, res) => {
    const message = await addAdminMessage({
        ticketId: req.params.ticketId,
        adminId: req.user.id,
        content: req.body.content,
        type: req.body.type,
    });

    return res.status(201).json(
        new ApiResponse(201, { message }, "Message added successfully")
    );
});

const getAdminTicketDetailsController = asyncHandler(async (req, res) => {
    const ticket = await getAdminTicketDetails(req.params.ticketId);

    return res.status(200).json(
        new ApiResponse(
            200,
            { ticket },
            "Admin ticket details fetched successfully"
        )
    );
});

const testGeminiController = asyncHandler(async (req, res) => {
    const result = await testGeminiModel();

    return res.status(200).json(
        new ApiResponse(200, result, "Gemini model test successful")
    );
});

export { getAdminTicketQueueController, updateAdminTicketController, assignTicketController, addAdminMessageController, getAdminTicketDetailsController, testGeminiController };