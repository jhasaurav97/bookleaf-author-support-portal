import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

const hashPassword = (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = (password, hashPassword) => {
    return bcrypt.compare(password, hashPassword);
}

export { hashPassword, comparePassword };