import "dotenv/config";
import app from "./app.js";
import { prisma } from "./db/prisma.js";

const port = process.env.PORT || 3000;

async function startServer() {
    try {
        await prisma.$connect();
        console.log("PostgreSQL connected successfully");

        app.listen(port, () => {
            console.log(`Server is listening on http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error.message);
        process.exit(1);
    }
}

startServer();