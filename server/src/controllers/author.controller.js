import { prisma } from "../db/prisma.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

const getAuthorBooks = asyncHandler(async (req, res) => {
    const books = await prisma.book.findMany({
        where: {
            authorId: req.user.id,
        },
        orderBy: {
            id: "asc",
        },
        select: {
            id: true,
            title: true,
            isbn: true,
            genre: true,
            publicationDate: true,
            status: true,
            mrp: true,
            totalCopiesSold: true,
            totalRoyaltyEarned: true,
            royaltyPaid: true,
            royaltyPending: true,
            availableOn: true,
        },
    });

    const formattedBooks = books.map((book) => ({
        ...book,
        mrp: book.mrp?.toNumber() ?? null,
        totalRoyaltyEarned: book.totalRoyaltyEarned.toNumber(),
        royaltyPaid: book.royaltyPaid.toNumber(),
        royaltyPending: book.royaltyPending.toNumber(),
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            { books: formattedBooks },
            "Books fetched successfully"
        )
    );
});

export { getAuthorBooks };