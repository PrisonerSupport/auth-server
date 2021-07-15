/**
 * Unit tests for the auth server utilities
 */

import { authenticate, insertUser } from '../src/db_utils';
import * as Errors from '../src/errors';
import { describe, it } from 'mocha';
import { expect, assert, should } from 'chai';


describe('Authentication database integration testing', function() {

    this.beforeAll(async function () {
        
    })

    describe('User insertion', function () {
        it('inserts user', async function () {
                await insertUser('user1', 'User 1', 'email', 'password');
        });

        it('fails at duplicate user entry', async function () {
            try {
                await insertUser('user1', 'Other User Name', 'email', 'otherPassword');
            }
            catch (err) {
                expect(err.name == Errors.DuplicateEntryError.name);
            }
        });
    });

    describe('User authentication', function() {
        it('authenticates the correct password of a user', async function () {
            const shouldBeTrue = await authenticate('user1', 'password');
            expect(shouldBeTrue);
        });

        it('fails to authenticate wrong password of a user'), async function() {
            const shouldBeFalse = await authenticate('user1', 'wrongpassword');
            expect(!shouldBeFalse);
        }

        it('properly throws error for non-existent user', async function () {
            try {
                await authenticate('nonExistentUser', 'password');
            }
            catch (err) {
                expect(err.name == Errors.NotFoundError.name);
            }
        });
    });
});