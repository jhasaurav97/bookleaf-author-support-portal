import { z } from "zod";

const adminTicketQuerySchema = z.object({
    status: z.enum([
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
    ]).optional(),

    category: z.enum([
        "ROYALTY_PAYMENTS",
        "ISBN_METADATA",
        "PRINTING_QUALITY",
        "DISTRIBUTION_AVAILABILITY",
        "BOOK_STATUS_PRODUCTION",
        "GENERAL_INQUIRY",
    ]).optional(),

    priority: z.enum([
        "CRITICAL",
        "HIGH",
        "MEDIUM",
        "LOW",
    ]).optional(),

    fromDate: z.string().optional(),
    toDate: z.string().optional(),

    ticketId: z.string().optional(),

    sortOrder: z.enum(["asc", "desc"]).default("desc"),

    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

const updateAdminTicketSchema = z.object({
    status: z.enum([
        "OPEN",
        "IN_PROGRESS",
        "RESOLVED",
        "CLOSED",
    ]).optional(),

    category: z.enum([
        "ROYALTY_PAYMENTS",
        "ISBN_METADATA",
        "PRINTING_QUALITY",
        "DISTRIBUTION_AVAILABILITY",
        "BOOK_STATUS_PRODUCTION",
        "GENERAL_INQUIRY",
    ]).optional(),

    priority: z.enum([
        "CRITICAL",
        "HIGH",
        "MEDIUM",
        "LOW",
    ]).optional(),
}).strict().refine(
    (data) => Object.keys(data).length > 0,
    { error: "Provide at least one field to update" }
);

const adminMessageSchema = z.object({
    content: z.string().trim().min(1).max(5000),
    type: z.enum(["RESPONSE", "INTERNAL_NOTE"]),
}).strict();

export { adminTicketQuerySchema, updateAdminTicketSchema, adminMessageSchema };
