import { describe, it } from 'mocha';
import { assert } from 'chai';

import { createPool, Pool } from 'mysql2/promise';

import * as Utils from '../../src/db_utils';
import * as Errors from '../../src/errors';
import * as Interfaces from '../../src/interfaces';

describe('Authentication database integration test', async function () {

    let connection: Pool;

    before(async function () {
        connection = createPool({
            connectionLimit: 10,
            host: 'localhost',
            user: 'authserver',
            password: 'dummy',
            database: 'testdb',
            namedPlaceholders: true
        });
    });

    after(async function () {
        // Clean up the mess we made
        await connection.execute('DELETE FROM `user`');
        await connection.end();
    });

    describe('Insertion tests', async function () {

        it('should insert user', async function () {
            await Utils.insertUser('user1', 'User 1', 'user@example.com', 'password', connection);
        }); 

        it('fail to duplicate insert username', async function () {
            try {
                await Utils.insertUser('user1', 'Other User', 'user2@example.com', 'otherPassword', connection);
            }
            catch (err) {
                if (err.name !== Errors.DuplicateEntryError.name) {
                    throw err;
                }
            }
        });

    describe('Authentication tests', async function () {

        it('should authenticate user with the right password', async function () {
            assert(await Utils.authenticate('user1', 'password', connection),
                    'Could not authenitcate user with correct password');
        });

        it('should not authenticate user with wrong password', async function () {
            assert(!(await Utils.authenticate('user1', 'wrongPassword', connection)),
                    'Incorrectly authenticated user with wrong password.');
        });

        it('should fail to authenticate a user that does not exist', async function () {
            try{
                await Utils.authenticate('user2', 'password', connection);
            }
            catch (err) {
                if (err.name !== Errors.NotFoundError.name) {
                    throw err;
                }
            }
        });

    });

    describe('Edit tests', async function () {

        it('should edit the entry information', async function () {
            let userEntry = await Utils.getUserByUserName('user1', connection);

            await Utils.editUserInfo('user1', null, null, 'new@email.com', null, connection);

            let newUserEntry = await Utils.getUserByUserName('user1', connection);

            assert(userEntry.username == newUserEntry.username, `Usernames do not match: ${userEntry.username}, ${newUserEntry.username}`);
            assert(userEntry.name == newUserEntry.name, `Names do not match: ${userEntry.name}, ${newUserEntry.name}`);
            assert(userEntry.email !== newUserEntry.email, `Emails still match: ${userEntry.email}, ${newUserEntry.email}`);
            assert(Buffer.compare(userEntry.hash, newUserEntry.hash) == 0, `Hashes do not match: ${userEntry.hash}, ${newUserEntry.hash}`)
            assert(Buffer.compare(userEntry.salt, newUserEntry.salt) == 0, `Salts do not match: ${userEntry.salt}, ${newUserEntry.salt}`);
            assert(userEntry.iterations == newUserEntry.iterations, `Iterations do not match: ${userEntry.iterations}, ${newUserEntry.iterations}`);
        });

    });

    describe('Deletion tests', async function () {

        it('should delete the entry for this username', async function () {
            await Utils.insertUser('user2', 'User for deletion', 'delete@this.user', 'pass', connection);
            await Utils.deleteUser('user2', connection);
            try {
                await Utils.getUserByUserName('user2', connection);
                throw Error('User2 still exists');
            }
            catch(err) {
                if (err.name !== Errors.NotFoundError.name) {
                    throw err;
                }
            }
        });

        it('should only delete the specified entry', async function () {
            let user1 = await Utils.getUserByUserName('user1', connection);
        });

    });

    });
});