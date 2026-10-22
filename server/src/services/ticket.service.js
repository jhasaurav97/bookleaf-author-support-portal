import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";
import { generateTicketAI } from "./ai.service.js";

const createTicket = async ({ authorId, authorName, bookId, subject, description }) => {
    const bookAISelect = {
        id: true,
        title: true,
        isbn: true,
        genre: true,
        publicationDate: true,
        status: true,
        mrp: true,
        authorRoyaltyPerCopy: true,
        totalCopiesSold: true,
        totalRoyaltyEarned: true,
        royaltyPaid: true,
        royaltyPending: true,
        lastRoyaltyPayoutDate: true,
        printPartner: true,
        availableOn: true,
    };

    let bookForAI = null;
    let authorBooksForAI = [];

    if (bookId) {
        bookForAI = await prisma.book.findFirst({
            where: {
                id: bookId,
                authorId,
            },
            select: bookAISelect,
        });

        if (!bookForAI) {
            throw new ApiError(
                404,
                "Book not found or does not belong to this author"
            );
        }
    } else {
        authorBooksForAI = await prisma.book.findMany({
            where: { authorId },
            orderBy: { id: "asc" },
            take: 5,
            select: bookAISelect,
        });
    }

    const ticketSelect = {
        id: true,
        subject: true,
        description: true,
        status: true,
        category: true,
        priority: true,
        aiStatus: true,
        createdAt: true,
        book: {
            select: {
                id: true,
                title: true,
            },
        },
    };

    const ticket = await prisma.ticket.create({
        data: {
            authorId,
            bookId: bookId || null,
            subject,
            description,
        },
        select: ticketSelect,
    });

    try {
        const aiResult = await generateTicketAI({
            subject,
            description,
            book: bookForAI,
            authorBooks: authorBooksForAI,
            authorName,
        });

        return await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                category: aiResult.category,
                priority: aiResult.priority,
                aiCategory: aiResult.category,
                aiPriority: aiResult.priority,
                aiDraft: aiResult.draftResponse,
                aiStatus: "COMPLETED",
                aiError: null,
            },
            select: ticketSelect,
        });
    } catch (error) {
        const aiError =
            error instanceof Error
                ? error.message.slice(0, 1000)
                : "Unknown AI processing error";

        console.error(
            `AI processing failed for ticket ${ticket.id}:`,
            aiError
        );

        try {
            return await prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    aiStatus: "FAILED",
                    aiError,
                },
                select: ticketSelect,
            });
        } catch (saveError) {
            console.error(
                `Could not save AI failure status for ticket ${ticket.id}:`,
                saveError
            );

            return ticket;
        }
    }
};

const getMyTickets = async (authorId) => {
    return prisma.ticket.findMany({
        where: { authorId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            subject: true,
            description: true,
            status: true,
            category: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            book: {
                select: {
                    id: true,
                    title: true
                },
            },
            messages: {
                where: { type: "RESPONSE" },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    sender: {
                        select: {
                            name: true,
                            role: true,
                        },
                    },
                },
            },
        },
    });
};

const getMyTicketById = async (authorId, ticketId) => {
    const ticket = await prisma.ticket.findFirst({
        where: {
            id: ticketId,
            authorId,
        },
        select: {
            id: true,
            subject: true,
            description: true,
            status: true,
            category: true,
            priority: true,
            createdAt: true,
            updatedAt: true,
            book: {
                select: {
                    id: true,
                    title: true,
                },
            },
            messages: {
                where: { type: "RESPONSE" },
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    sender: {
                        select: {
                            name: true,
                            role: true
                        },
                    },
                },
            },
        },
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    return ticket;
}

export { createTicket, getMyTickets, getMyTicketById };