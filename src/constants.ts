/**
 * Global constants for authorization
 */

import { createPool } from 'mysql2';
import * as Errors from './errors';
import { memoize } from 'lodash'


function getAuthDBPassword() {
    if (process.env.AUTHDBPASS == undefined) {
        throw new Errors.NotFoundError('Environment variable RESOURCEDBPASS not found.');
    }

    return process.env.AUTHDBPASS;
}

/**
 * Cache this so we don't keep querying the system
 */
const cachedGetAuthDBPassword = memoize(getAuthDBPassword)

export const constants = {
    USER_DB_POOL: createPool({
        connectionLimit: 10,
        host: 'localhost',
        user: 'webserver',
        password: cachedGetAuthDBPassword(),
        database: 'users'
    }),
}