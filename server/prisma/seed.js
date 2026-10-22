import "dotenv/config";
import { readFile } from "node:fs/promises";
import { prisma } from "../src/db/prisma.js";
import { hashPassword } from "../src/utils/password.utils.js";

const toDate = (value) =>
    value ? new Date(`${value}T00:00:00.000Z`) : null;

async function main() {
    const authorPassword = process.env.SEED_AUTHOR_PASSWORD;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();

    if (!authorPassword || !adminPassword || !adminEmail) {
        throw new Error("Seed credentials are missing from .env");
    }

    const json = await readFile(
        new URL("./seed-data.json", import.meta.url),
        "utf8"
    );

    const { authors } = JSON.parse(json);

    if (
        !Array.isArray(authors) ||
        authors.length === 0 ||
        !authors.every(
            (author) =>
                author.author_id &&
                author.email &&
                Array.isArray(author.books)
        )
    ) {
        throw new Error("Invalid author data in seed-data.json");
    }

    const totalBooks = authors.reduce(
        (total, author) => total + author.books.length,
        0
    );

    // Prevent conflicting author/admin accounts.
    if (
        authors.some(
            (author) =>
                author.email.trim().toLowerCase() === adminEmail ||
                author.author_id === "ADMIN001"
        )
    ) {
        throw new Error("Admin credentials conflict with an author record");
    }

    // Prepare unique password hashes outside the database transaction.
    const preparedAuthors = await Promise.all(
        authors.map(async (author) => ({
            author,
            passwordHash: await hashPassword(authorPassword),
        }))
    );

    const adminPasswordHash = await hashPassword(adminPassword);

    await prisma.$transaction(async (tx) => {
        for (const { author, passwordHash } of preparedAuthors) {
            await tx.user.upsert({
                where: { id: author.author_id },

                update: {
                    name: author.name,
                    email: author.email.trim().toLowerCase(),
                    phone: author.phone,
                    city: author.city,
                    joinedDate: toDate(author.joined_date),
                    role: "AUTHOR",
                },

                create: {
                    id: author.author_id,
                    name: author.name,
                    email: author.email.trim().toLowerCase(),
                    passwordHash,
                    role: "AUTHOR",
                    phone: author.phone,
                    city: author.city,
                    joinedDate: toDate(author.joined_date),
                },
            });
        }

        for (const { author } of preparedAuthors) {
            for (const book of author.books) {
                const bookData = {
                    authorId: author.author_id,
                    title: book.title,
                    isbn: book.isbn,
                    genre: book.genre,
                    publicationDate: toDate(book.publication_date),
                    status: book.status,
                    mrp: book.mrp,
                    authorRoyaltyPerCopy: book.author_royalty_per_copy,
                    totalCopiesSold: book.total_copies_sold,
                    totalRoyaltyEarned: book.total_royalty_earned,
                    royaltyPaid: book.royalty_paid,
                    royaltyPending: book.royalty_pending,
                    lastRoyaltyPayoutDate: toDate(
                        book.last_royalty_payout_date
                    ),
                    printPartner: book.print_partner,
                    availableOn: book.available_on,
                };

                await tx.book.upsert({
                    where: { id: book.book_id },

                    update: bookData,

                    create: {
                        id: book.book_id,
                        ...bookData,
                    },
                });
            }
        }

        await tx.user.upsert({
            where: { id: "ADMIN001" },

            update: {
                name: "BookLeaf Admin",
                email: adminEmail,
                role: "ADMIN",
            },

            create: {
                id: "ADMIN001",
                name: "BookLeaf Admin",
                email: adminEmail,
                passwordHash: adminPasswordHash,
                role: "ADMIN",
            },
        });
    });

    console.log("Seed completed successfully.");
    console.log(`Authors processed: ${authors.length}`);
    console.log(`Books processed: ${totalBooks}`);
    console.log(`Admin account: ${adminEmail}`);
}

main()
    .catch((error) => {
        console.error("Seeding failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });