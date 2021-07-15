"use strict";
/**
 * Custom exceptions for auth server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateEntryError = exports.NotFoundError = void 0;
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = "NotFoundError";
    }
}
exports.NotFoundError = NotFoundError;
class DuplicateEntryError extends Error {
    constructor(message) {
        super(message);
        this.name = "DuplicateUserError";
    }
}
exports.DuplicateEntryError = DuplicateEntryError;
