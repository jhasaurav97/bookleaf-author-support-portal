import { ApiError } from "../utils/api-error.js";

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        return next(
            new ApiError(422, "Received data is not valid", errors)
        );
    }

    req.body = result.data;
    next();
};

const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
        return next(
            new ApiError(422, "Invalid query parameters", errors)
        );
    }

    req.validatedQuery = result.data;
    next();
}

export { validate, validateQuery };