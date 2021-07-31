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
exports.getUserByUserName = exports.deleteUser = exports.editUserInfo = exports.insertUser = exports.authenticate = void 0;
const crypto_1 = require("crypto");
const Errors = __importStar(require("./errors"));
// ---- HASHING LOGIC ----
function _hashAndSalt(password, salt = crypto_1.randomBytes(16), iterations = crypto_1.randomInt(80000, 100000)) {
    return __awaiter(this, void 0, void 0, function* () {
        // Generate a hash from the salt and iteration count
        let hash = yield new Promise((resolve, reject) => crypto_1.pbkdf2(password, salt, iterations, 32, 'sha256', (err, derivedKey) => {
            if (err)
                reject(err);
            resolve(derivedKey);
        }));
        // Return a dictionary of attributes for storage in db
        return {
            'hash': hash,
            'salt': salt,
            'iterations': iterations
        };
    });
}
// ---- DB QUERY TOOLS ----
/**
 * Grabs the user from the database.
 *
 * @param _id - the username value of the desired user.
 * @param connection - the pool connection for the user database.
 * @returns the first match for the given username in the database.
 */
function getUserByUserName(username, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const [rows, _] = yield connection.query('SELECT * FROM `user` WHERE `username` = ?', [username]);
        // If we have no rows returned to us then report that the user wasn't found
        if (!rows.length) {
            throw new Errors.NotFoundError(`No entry for user ${username} in the authorization DB.`);
        }
        // Return as User
        return rows[0];
    });
}
exports.getUserByUserName = getUserByUserName;
/**
 * Authenticates a user's password.
 *
 * @param username - the username value of the desired user.
 * @param password - the proposed password for the user.
 * @param connection - optional connection for debugging use.
 * @returns true if the password matches the stored password for the user and false otherwise.
 */
function authenticate(username, password, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        let user = yield getUserByUserName(username, connection = connection);
        let hash = yield _hashAndSalt(password, user.salt, user.iterations);
        return Buffer.compare(hash.hash, user.hash) == 0;
    });
}
exports.authenticate = authenticate;
/**
 * Creates an entry for a new user in the DB.
 *
 * @param username - the username value of the new user.
 * @param name - the name of the new user.
 * @param password - the password for the new user.
 */
function insertUser(username, name, email, password, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        // User doesn't exist, generate hash
        let generatedPass = yield _hashAndSalt(password);
        let user = {
            username: username,
            name: name,
            email: email,
            hash: generatedPass.hash,
            salt: generatedPass.salt,
            iterations: generatedPass.iterations
        };
        const [result, _] = yield connection.query('INSERT IGNORE INTO `user` SET ?', [user]);
        if (result.affectedRows == 0) {
            throw new Errors.DuplicateEntryError(`Entry for ${username} already exists.`);
        }
    });
}
exports.insertUser = insertUser;
/**
 * Edit an existing user's information. Only edit information that has an argument passed in for it.
 *
 * @param username - the current username of the entry to be edited
 * @param newUsername - the new username to replace in the entry
 * @param name - the new name to replace in the entry
 * @param email - the new email to replace in the entry
 * @param password - the new password to replace in the entry
 * @param connection - the DB pool to target
 */
function editUserInfo(username, newUsername, name, email, password, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        // Return immediately if nothing to change
        if (newUsername == null
            && name == null
            && email == null
            && password == null) {
            console.log('nothing to edit');
            return;
        }
        // Retrieve existing entry by the id of the new entry
        const currentEntry = yield getUserByUserName(username, connection = connection);
        // Only rehash the password if the password field has been submitted
        let hash = password !== null ? yield _hashAndSalt(password, currentEntry.salt, currentEntry.iterations)
            : { hash: currentEntry.hash, salt: currentEntry.salt, iterations: currentEntry.iterations };
        let newEntry = {
            username: newUsername !== null ? newUsername : username,
            name: name !== null ? name : currentEntry.name,
            email: email !== null ? email : currentEntry.email,
            hash: hash.hash,
            salt: hash.salt,
            iterations: hash.iterations
        };
        let [result, _] = yield connection.query('UPDATE `user` SET ? WHERE `username` = ?', [newEntry, newEntry.username]);
        // The 'changedRows' attribute isn't available in ResultSetHeader interface for some reason
        let changedRows = result.changedRows;
        if (changedRows > 1) {
            console.log(`Updated ${result.changedRows} rows. Should only update 1 row.`);
            throw new Errors.DuplicateEntryError(`Found and updated duplicate entries for username: ${username}`);
        }
        else if (changedRows == 0) {
            throw new Errors.NotFoundError(`No user found to edit with username ${username}`);
        }
    });
}
exports.editUserInfo = editUserInfo;
/**
 * Delete a user if that user exists.
 *
 * @param username - the username of the user to be deleted
 * @param connection - the DB pool to target
 */
function deleteUser(username, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        // This query should return a ResultSetHeader every time
        const [result, _] = yield connection.query('DELETE FROM `user` WHERE `username` = ?', [username]);
        // Check to see whether we have actually deleted a row, if not throw NotFoundError
        if (result.affectedRows == 0) {
            throw new Errors.NotFoundError(`No username ${username} exists to delete.`);
        }
    });
}
exports.deleteUser = deleteUser;
