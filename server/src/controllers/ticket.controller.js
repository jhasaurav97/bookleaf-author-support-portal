import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createTicket, getMyTicketById, getMyTickets } from "../services/ticket.service.js";

const createTicketController = asyncHandler(async (req, res) => {
    const ticket = await createTicket({
        authorId: req.user.id,
        authorName: req.user.name,
        bookId: req.body.bookId,
        subject: req.body.subject,
        description: req.body.description,
    });

    return res.status(201).json(
        new ApiResponse(201, {ticket}, "Support ticket created successfully")
    );
});

const getMyTicketsController = asyncHandler(async (req, res) => {
    const tickets = await getMyTickets(req.user.id);

    return res.status(200).json(
        new ApiResponse(200, { tickets }, "Tickets fetched successfully")
    );
});

const getMyTicketDetailsController = asyncHandler(async (req, res) => {
    const ticket = await getMyTicketById(req.user.id, req.params.ticketId);

    return res.status(200).json(
        new ApiResponse(200, { ticket }, "Ticket fetched successfully")
    );
});

export { createTicketController, getMyTicketsController, getMyTicketDetailsController };