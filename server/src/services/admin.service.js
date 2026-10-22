import { prisma } from "../db/prisma.js";
import { ApiError } from "../utils/api-error.js";

const getAdminTicketQueue = async (filters) => {
    const {
        status,
        category,
        priority,
        fromDate,
        toDate,
        ticketId,
        sortOrder = "desc",
        page,
        limit,
    } = filters;

    const where = {
        ...(status && { status }),
        ...(category && { category }),
        ...(priority && { priority }),
    };

    if (ticketId) {
        where.id = { contains: ticketId, mode: "insensitive" };
    }

    if (fromDate || toDate) {
        where.createdAt = {
            ...(fromDate && {
                gte: new Date(`${fromDate}T00:00:00.000Z`),
            }),
            ...(toDate && {
                lte: new Date(`${toDate}T23:59:59.999Z`),
            }),
        };
    }

    const [tickets, total] = await prisma.$transaction([
        prisma.ticket.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,

            orderBy: [
                { createdAt: sortOrder },
                { id: "asc" },
            ],

            select: {
                id: true,
                subject: true,
                description: true,
                status: true,
                category: true,
                priority: true,
                aiCategory: true,
                aiPriority: true,
                aiStatus: true,
                createdAt: true,

                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                book: {
                    select: {
                        id: true,
                        title: true,
                    },
                },

                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        }),

        prisma.ticket.count({ where }),
    ]);

    return {
        tickets,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const updateAdminTicket = async (ticketId, data) => {
    const ticket = await prisma.ticket.findMany({
        where: { id: ticketId },
        select: { id: true },
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    return prisma.ticket.update({
        where: { id: ticketId },
        data,
        select: {
            id: true,
            status: true,
            category: true,
            priority: true,
            updatedAt: true,
        },
    });
};

const assignTicketToAdmin = async (ticketId, adminId) => {
    if (!adminId) {
        throw new ApiError(401, "Admin identity is missing");
    }

    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    return prisma.ticket.update({
        where: { id: ticketId },
        data: {
            assignedToId: adminId,
        },
        select: {
            id: true,
            assignedToId: true,
            updatedAt: true,
        },
    });
};

const addAdminMessage = async ({ ticketId, adminId, content, type }) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
    });

    if (!ticket) {
        throw new ApiError(404, "Ticket not found");
    }

    return await prisma.ticketMessage.create({
        data: {
            ticketId,
            senderId: adminId,
            content,
            type,
        },
        select: {
            id: true,
            ticketId: true,
            content: true,
            type: true,
            createdAt: true,
        },
    });
};

const getAdminTicketDetails = async (ticketId) => {
    const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
            id: true,
            subject: true,
            status: true,
            category: true,
            priority: true,
            aiCategory: true,
            aiPriority: true,
            aiDraft: true,
            aiStatus: true,
            aiError: true,
            createdAt: true,
            updatedAt: true,

            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            book: {
                select: {
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
                },
            },

            assignedTo: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            messages: {
                orderBy: { createdAt: "asc" },
                select: {
                    id: true,
                    content: true,
                    type: true,
                    createdAt: true,
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
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
};

export { getAdminTicketQueue, updateAdminTicket, assignTicketToAdmin, addAdminMessage, getAdminTicketDetails };
