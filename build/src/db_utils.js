"use strict";
/**
 * UTILITIES FOR INTERACTING WITH THE MYSQL `USER` DB
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByUsername = exports.insertUser = exports.authenticate = void 0;
const crypto_1 = require("crypto");
const promise_1 = require("mysql2/promise");
const constants_1 = require("./constants");
const Errors = __importStar(require("./errors"));
// ---- HASHING LOGIC ----
function _hashAndSalt(password, salt = crypto_1.randomBytes(16), iterations = crypto_1.randomInt(80000, 100000)) {
    let hash = Buffer.alloc(32); // Allocate default buffer, TODO: this feels janky
    crypto_1.pbkdf2(password, salt, iterations, 32, 'sha256', (err, derivedKey) => {
        if (err)
            throw err;
        hash = derivedKey;
    });
    // Return a dictionary of attributes for storage in db
    return {
        'hash': hash,
        'salt': salt,
        'iterations': iterations
    };
}
// ---- DB QUERY TOOLS ----
/**
 * Grabs the user from the database.
 *
 * @param _id - the username value of the desired user.
 * @param connection - the pool connection for the user database.
 * @returns the first match for the given username in the database.
 */
function getUserByUsername(_id, connection = constants_1.constants.USER_DB_POOL.promise()) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const [rows, fields] = yield connection.execute('SELECT * FROM `user` WHERE `_id` = ?', [promise_1.escape(_id)]);
            if (!rows.length)
                throw new Errors.NotFoundError(`No entry for user ${_id} in the authorization DB.`);
            // Return as User
            return rows[0];
        }
        catch (err) {
            throw err;
        }
    });
}
exports.getUserByUsername = getUserByUsername;
/**
 * Authenticates a user's password.
 *
 * @param _id - the username value of the desired user.
 * @param password - the proposed password for the user.
 * @param connection - optional connection for debugging use.
 * @returns true if the password matches the stored password for the user and false otherwise.
 */
function authenticate(_id, password, connection = constants_1.constants.USER_DB_POOL.promise()) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let user = yield getUserByUsername(_id, connection = connection);
            let hash = _hashAndSalt(password, user.salt, user.iterations);
            if (hash.hash == user.hash) {
                return true;
            }
            return false;
        }
        catch (err) {
            throw err;
        }
    });
}
exports.authenticate = authenticate;
/**
 * Creates an entry for a new user in the DB.
 *
 * @param _id - the username value of the new user.
 * @param name - the name of the new user.
 * @param password - the password for the new user.
 */
function insertUser(_id, name, email, password, connection = constants_1.constants.USER_DB_POOL.promise()) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Check if the user exists
            yield getUserByUsername(_id, connection = connection);
            // If user exists then throw back an error
            throw new Errors.DuplicateEntryError(`Username ${_id} already exists in database.`);
        }
        catch (err) {
            if (err.name !== Errors.NotFoundError.name) {
                throw err;
            }
            // User doesn't exist, generate hash
            var generatedPass = _hashAndSalt(password);
            var user = {
                '_id': promise_1.escape(_id),
                'name': promise_1.escape(name),
                'email': promise_1.escape(email),
                'hash': generatedPass.hash,
                'salt': generatedPass.salt,
                'iterations': generatedPass.iterations
            };
            try {
                yield connection.execute('INSERT INTO `user` SET ?', [user]);
            }
            catch (err) {
                console.log(`Failed to insert ${_id}.`);
                throw err;
            }
        }
    });
}
exports.insertUser = insertUser;
