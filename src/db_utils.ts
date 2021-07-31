/**
 * UTILITIES FOR INTERACTING WITH THE MYSQL `USER` DB
 */

import { pbkdf2, randomBytes, randomInt } from 'crypto';

import { Pool, ResultSetHeader, OkPacket, RowDataPacket } from 'mysql2/promise';

import { createLogger } from 'winston';

import * as Errors from './errors';
import * as Interfaces from './interfaces'

// ---- HASHING LOGIC ----

async function _hashAndSalt(password:string, salt:Buffer=randomBytes(16), iterations:number=randomInt(80000,100000)) {
    
    // Generate a hash from the salt and iteration count
    let hash: Buffer = await new Promise((resolve, reject) => pbkdf2(
        password,
        salt,
        iterations,
        32,
        'sha256',
        (err, derivedKey) => {
            if (err) reject(err);
            resolve(derivedKey);
        }
    ));

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
async function getUserByUserName(username: string, connection: Pool) {
    const [rows, _] = await connection.query('SELECT * FROM `user` WHERE `username` = ?', [username]);
    
    // If we have no rows returned to us then report that the user wasn't found
    if (!(rows as RowDataPacket).length) { 
        throw new Errors.NotFoundError(`No entry for user ${username} in the authorization DB.`);
    }

    // Return as User
    return (rows as any)[0] as Interfaces.UserEntry;
}

/**
 * Authenticates a user's password.
 * 
 * @param username - the username value of the desired user.
 * @param password - the proposed password for the user.
 * @param connection - optional connection for debugging use.
 * @returns true if the password matches the stored password for the user and false otherwise.
 */
async function authenticate(username: string, password: string, connection: Pool) {
    let user: Interfaces.UserEntry = await getUserByUserName(username, connection=connection);
    let hash = await _hashAndSalt(password, user.salt, user.iterations);

    return Buffer.compare(hash.hash, user.hash) == 0;
}

/**
 * Creates an entry for a new user in the DB.
 * 
 * @param username - the username value of the new user.
 * @param name - the name of the new user.
 * @param password - the password for the new user.
 */
async function insertUser(username: string, name: string, email: string, password: string, connection: Pool) {
    // User doesn't exist, generate hash
    let generatedPass = await _hashAndSalt(password);
    let user = {
        username: username,
        name: name,
        email: email,
        hash: generatedPass.hash,
        salt: generatedPass.salt,
        iterations: generatedPass.iterations
    };


    const [result, _] = await connection.query('INSERT IGNORE INTO `user` SET ?', [user]);

    if ((result as ResultSetHeader).affectedRows == 0) { 
        throw new Errors.DuplicateEntryError(`Entry for ${username} already exists.`);
    }
}

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
async function editUserInfo(username: string, 
                            newUsername: string | null,
                            name: string | null,
                            email: string | null,
                            password: string | null,
                            connection: Pool) {

    // Return immediately if nothing to change
    if (newUsername == null
        && name == null 
        && email == null 
        && password == null) {
            console.log('nothing to edit');
            return;
        }

    // Retrieve existing entry by the id of the new entry
    const currentEntry: Interfaces.UserEntry = await getUserByUserName(username, connection=connection);
    
    // Only rehash the password if the password field has been submitted
    let hash = password !== null ? await _hashAndSalt(password, currentEntry.salt, currentEntry.iterations)
                                    : { hash: currentEntry.hash, salt: currentEntry.salt, iterations: currentEntry.iterations };
    
    let newEntry: Interfaces.UserEntry = {
        username: newUsername !== null ? newUsername : username,
        name: name !== null ? name : currentEntry.name,
        email: email !== null ? email : currentEntry.email,
        hash: hash.hash,
        salt: hash.salt,
        iterations: hash.iterations
    }
    
    let [result, _] = await connection.query('UPDATE `user` SET ? WHERE `username` = ?', [newEntry, newEntry.username]);

    // The 'changedRows' attribute isn't available in ResultSetHeader interface for some reason
    let changedRows = (result as OkPacket).changedRows
    if (changedRows > 1) {
        console.log(`Updated ${(result as OkPacket).changedRows} rows. Should only update 1 row.`);
        throw new Errors.DuplicateEntryError(`Found and updated duplicate entries for username: ${username}`);
    }
    else if (changedRows == 0) {
        throw new Errors.NotFoundError(`No user found to edit with username ${username}`)
    }
}

/**
 * Delete a user if that user exists.
 * 
 * @param username - the username of the user to be deleted
 * @param connection - the DB pool to target
 */
async function deleteUser(username: string, connection: Pool) {
        // This query should return a ResultSetHeader every time
        const [result, _] = await connection.query('DELETE FROM `user` WHERE `username` = ?', [username]);

        // Check to see whether we have actually deleted a row, if not throw NotFoundError
        if ((result as ResultSetHeader).affectedRows == 0) { 
            throw new Errors.NotFoundError(`No username ${username} exists to delete.`);
        }
}

export { authenticate, insertUser, editUserInfo, deleteUser, getUserByUserName };