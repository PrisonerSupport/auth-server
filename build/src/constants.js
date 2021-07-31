"use strict";
/**
 * Global constants for authorization
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.constants = void 0;
const promise_1 = require("mysql2/promise");
const Errors = __importStar(require("./errors"));
const lodash_1 = require("lodash");
/**
 * Helper to grab the env variable for the database password or throw error if it doesn't exist
 *
 * @returns the environment variable containing the password for the database
 */
function getAuthDBPassword() {
    if (process.env.AUTHDBPASS == undefined) {
        throw new Errors.NotFoundError('Environment variable AUTHDBPASS not found.');
    }
    return process.env.AUTHDBPASS;
}
/**
 * Cache this so we don't keep querying the system
 */
const cachedGetAuthDBPassword = lodash_1.memoize(getAuthDBPassword);
exports.constants = {
    /**
     * We keep the pool as a constant since we want it to always be running from the onset of the script
     */
    USER_DB_POOL: promise_1.createPool({
        connectionLimit: 10,
        host: 'localhost',
        user: 'authserver',
        password: 'dummy',
        database: 'users',
        namedPlaceholders: true
    }),
};
