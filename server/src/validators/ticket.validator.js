import {z} from "zod";


const createTicketSchema = z.object({
    bookId: z.string().trim().min(1).max(64).nullable().optional(),

    subject: z
        .string()
        .trim()
        .min(3, { error: "Subject must be at least 3 characters" })
        .max(150, { error: "Subject cannot exceed 150 characters" }),
    
    description: z
        .string()
        .trim()
        .min(10, { error: "Description must be at least 10 characters" })
        .max(5000, { error: "Description cannot exceed 5000 characters" })
}).strict();

export { createTicketSchema };