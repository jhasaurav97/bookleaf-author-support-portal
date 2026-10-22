import { prisma } from "../db/prisma.js";

const getAuthorDashboardSummary = async (authorId) => {
    const [bookCount, ticketStats, latestReplies, recentTickets] = await Promise.all([
        prisma.book.count({ where: { authorId } }),
        prisma.ticket.groupBy({
            by: ['status'],
            where: { authorId },
            _count: { id: true }
        }),
        prisma.ticketMessage.findMany({
            where: {
                type: 'RESPONSE',
                ticket: { authorId }
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
                ticket: {
                    select: { id: true, subject: true }
                },
                sender: {
                    select: { name: true }
                }
            }
        }),
        prisma.ticket.findMany({
            where: { authorId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                subject: true,
                status: true,
                priority: true,
                createdAt: true,
            }
        })
    ]);

    const statusCounts = {};
    ticketStats.forEach(stat => {
        statusCounts[stat.status] = stat._count.id;
    });

    return {
        bookCount,
        ticketCounts: {
            total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
            open: statusCounts['OPEN'] || 0,
            inProgress: statusCounts['IN_PROGRESS'] || 0,
            ...statusCounts
        },
        latestReplies: latestReplies.map((reply) => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,
            ticketId: reply.ticket.id,
            ticketSubject: reply.ticket.subject,
            senderName: reply.sender.name
        })),
        recentTickets
    };
};

const getAdminDashboardSummary = async () => {
    const [totalTickets, statusCounts, urgentTickets, recentTickets] = await Promise.all([
        prisma.ticket.count(),
        prisma.ticket.groupBy({
            by: ['status'],
            _count: { id: true }
        }),
        prisma.ticket.findMany({
            where: {
                status: { not: 'CLOSED' },
                priority: { in: ['CRITICAL', 'HIGH'] }
            },
            orderBy: [
                { priority: 'asc' },
                { createdAt: 'asc' }
            ],
            take: 5,
            select: {
                id: true,
                subject: true,
                priority: true,
                status: true,
                createdAt: true,
                author: { select: { name: true } }
            }
        }),
        prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                subject: true,
                priority: true,
                status: true,
                createdAt: true,
                author: { select: { name: true } }
            }
        })
    ]);

    const statusMap = {};
    statusCounts.forEach(stat => {
        statusMap[stat.status] = stat._count.id;
    });

    return {
        totalTickets,
        counts: {
            open: statusMap['OPEN'] || 0,
            inProgress: statusMap['IN_PROGRESS'] || 0,
            resolved: statusMap['RESOLVED'] || 0,
            closed: statusMap['CLOSED'] || 0,
        },
        urgentTickets,
        recentTickets
    };
};

export { getAuthorDashboardSummary, getAdminDashboardSummary };
