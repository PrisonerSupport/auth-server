/**
 * Global constants for authorization
 */

import { createPool } from 'mysql2/promise';
import * as Errors from './errors';
import { memoize } from 'lodash'

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
const cachedGetAuthDBPassword = memoize(getAuthDBPassword)

export const constants = {
    /**
     * We keep the pool as a constant since we want it to always be running from the onset of the script
     */
    USER_DB_POOL: createPool({
        connectionLimit: 10,
        host: 'localhost',
        user: 'authserver',
        password: 'dummy',
        database: 'users',
        namedPlaceholders: true
    }),
}