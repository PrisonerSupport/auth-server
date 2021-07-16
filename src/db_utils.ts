/**
 * UTILITIES FOR INTERACTING WITH THE MYSQL `USER` DB
 */

import { BinaryLike, pbkdf2, randomBytes, randomInt } from 'crypto';
import { escape, Pool } from 'mysql2/promise';
import { constants } from './constants';
import * as Errors from './errors';

// ---- TYPE INTERFACES ----
interface UserEntry {
    username: string,
    name?: string,
    email: string,
    hash: BinaryLike,
    salt: BinaryLike,
    iterations: number
}

interface User {
    username: string,
    name?: string,
    email: string,
    password: string
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
async function _getUserByUsername(username: string, connection: Pool=constants.USER_DB_POOL.promise()) {
    try {
        const [rows, fields] = await connection.execute('SELECT * FROM `user` WHERE `username` = ?', [escape(username)]);
        if (!(rows as any).length) throw new Errors.NotFoundError(`No entry for user ${username} in the authorization DB.`);

        // Return as User
        return (rows as any)[0] as UserEntry;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Authenticates a user's password.
 * 
 * @param username - the username value of the desired user.
 * @param password - the proposed password for the user.
 * @param connection - optional connection for debugging use.
 * @returns true if the password matches the stored password for the user and false otherwise.
 */
async function authenticate(username: string, password: string, connection: Pool=constants.USER_DB_POOL.promise()) {

    try {
        let user: UserEntry = await _getUserByUsername(username, connection=connection);
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
 * @param username - the username value of the new user.
 * @param name - the name of the new user.
 * @param password - the password for the new user.
 */
async function insertUser(username: string, name: string, email: string, password: string, 
                          connection: Pool=constants.USER_DB_POOL.promise()) {
    try {
        // Check if the user exists
        await _getUserByUsername(username, connection=connection);
        // If user exists then throw back an error
        throw new Errors.DuplicateEntryError(`Username ${username} already exists in database.`);
    } catch (err) {
        if (err.name !== Errors.NotFoundError.name) {
            throw err;
        }
        // User doesn't exist, generate hash
        var generatedPass = _hashAndSalt(password);
        var user = {
            '_id': escape(username),
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
            console.log(`Failed to insert ${username}.`);
            throw err;
        }
    }
}

/**
 * Edit an existing user's information
 * 
 * @param userInfo - the User representation of the user
 * @param connection - the DB pool to target
 */
async function editUserInfo(userInfo: User, connection: Pool=constants.USER_DB_POOL.promise()) {
    try {
        // Retrieve existing entry by the id of the new entry
        let currentEntry: UserEntry = await _getUserByUsername(userInfo.username, connection=connection);


        let hash = _hashAndSalt(userInfo.password, currentEntry.salt, currentEntry.iterations);
        let newEntry: UserEntry = {
            username: userInfo.username,
            name: userInfo.name,
            email: userInfo.email,
            hash: hash.hash,
            salt: hash.salt,
            iterations: hash.iterations
        }

        if (currentEntry == newEntry) {
            // If they're the same, don't send a query just return
            return
        }
        
        let [rows, _] = await connection.execute('UPDATE `user` SET ? WHERE `username` = ?', [newEntry, newEntry.username]);

        if ((rows as any).length > 1) {
            console.log(`Updated ${(rows as any).length} rows. Should only update 1 row.`);
            throw new Errors.DuplicateEntryError(`Found and updated duplicate entries for username: ${newEntry.username}`);
        }

    }
    catch (err) {
        if (err.name == Errors.NotFoundError.name) {
            console.log(`User ${userInfo.username} does not exist`);
        }

        console.log(`Failed to update information for ${userInfo.username}`);
        throw err;
    }
}

/**
 * Delete a user
 * 
 * @param username - the username of the user to be deleted
 * @param connection - the DB pool to target
 */
async function deleteUser(username: string, connection: Pool=constants.USER_DB_POOL.promise()) {

}


export { authenticate, insertUser, };