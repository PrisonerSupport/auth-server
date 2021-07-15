/**
 * UTILITIES FOR INTERACTING WITH THE MYSQL `USER` DB
 */

import { BinaryLike, pbkdf2, randomBytes, randomInt } from 'crypto';
import { escape, Pool } from 'mysql2/promise';
import { constants } from './constants';
import * as Errors from '../errors';

// ---- TYPE INTERFACES ----
interface User {
    _id: string,
    name: string,
    email: string,
    hash: BinaryLike,
    salt: BinaryLike,
    iterations: number
}

// ---- HASHING LOGIC ----

function _hashAndSalt(password:string, salt:BinaryLike=randomBytes(16), iterations:number=randomInt(80000,100000)) {
    let hash: Buffer = Buffer.alloc(32)  // Allocate default buffer, TODO: this feels janky
    pbkdf2(
        password,
        salt,
        iterations,
        32,
        'sha256',
        (err, derivedKey) => {
            if (err) throw err
            hash = derivedKey
        }
    );
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
async function getUserByUsername(_id: string, connection: Pool=constants.USER_DB_POOL.promise()) {
    try {
        const [rows, fields] = await connection.execute('SELECT * FROM `user` WHERE `_id` = ?', [escape(_id)]);
        if (!(rows as any).length) throw new Errors.NotFoundError(`No entry for user ${_id} in the authorization DB.`);

        // Return as User
        return (rows as any)[0] as User;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Authenticates a user's password.
 * 
 * @param _id - the username value of the desired user.
 * @param password - the proposed password for the user.
 * @param connection - optional connection for debugging use.
 * @returns true if the password matches the stored password for the user and false otherwise.
 */
async function authenticate(_id: string, password: string, connection: Pool=constants.USER_DB_POOL.promise()) {

    try {
        let user = await getUserByUsername(_id, connection=connection);
        let hash = _hashAndSalt(password, user.salt, user.iterations);

        if (hash.hash == user.hash) {
            return true;
        }

        return false;
    }
    catch (err) { throw err; }
}

/**
 * Creates an entry for a new user in the DB.
 * 
 * @param _id - the username value of the new user.
 * @param name - the name of the new user.
 * @param password - the password for the new user.
 */
async function insertUser(_id: string, name: string, email: string, password: string, 
                          connection: Pool=constants.USER_DB_POOL.promise()) {
    try {
        // Check if the user exists
        await getUserByUsername(_id, connection=connection);
        // If user exists then throw back an error
        throw new Errors.DuplicateEntryError(`Username ${_id} already exists in database.`);
    } catch (err) {
        if (err.name !== Errors.NotFoundError.name) {
            throw err;
        }
        // User doesn't exist, generate hash
        var generatedPass = _hashAndSalt(password);
        var user = {
            '_id': escape(_id),
            'name': escape(name),
            'email': escape(email),
            'hash': generatedPass.hash,
            'salt': generatedPass.salt,
            'iterations': generatedPass.iterations
        };


        try {
            await connection.execute('INSERT INTO `user` SET ?', [user]);
        }
        catch (err) {
            console.log(`Failed to insert ${_id}.`);
            throw err;
        }
    }
}

export { authenticate, insertUser, getUserByUsername };