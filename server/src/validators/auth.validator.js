import { z } from "zod";

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .max(255, { error: "Email must be at most 255 characters" })
        .pipe(
            z.email({ error: "Enter a valid email address" })
        ),

    password: z
        .string()
        .min(1, "Password is required")
        .max(128, "Password is too long")
})

export { loginSchema };