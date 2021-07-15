/**
 * Custom exceptions for auth server
 */

class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError"
    }
}

class DuplicateEntryError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DuplicateUserError";
    }
}

export { NotFoundError, DuplicateEntryError }