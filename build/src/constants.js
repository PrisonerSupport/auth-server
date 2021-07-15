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
const mysql2_1 = require("mysql2");
const Errors = __importStar(require("./errors"));
const lodash_1 = require("lodash");
function getAuthDBPassword() {
    if (process.env.AUTHDBPASS == undefined) {
        throw new Errors.NotFoundError('Environment variable RESOURCEDBPASS not found.');
    }
    return process.env.AUTHDBPASS;
}
/**
 * Cache this so we don't keep querying the system
 */
const cachedGetAuthDBPassword = lodash_1.memoize(getAuthDBPassword);
exports.constants = {
    USER_DB_POOL: mysql2_1.createPool({
        connectionLimit: 10,
        host: 'localhost',
        user: 'webserver',
        password: cachedGetAuthDBPassword(),
        database: 'users'
    }),
};
