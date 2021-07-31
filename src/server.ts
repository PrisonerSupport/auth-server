/**
 * Main entry point for the authentication server
 */

import express, { Request, Response } from 'express';
import { urlencoded } from 'body-parser';

import * as Utils from './db_utils';
import { constants } from './constants';

import * as Errors from './errors';

let auth = express()
// Let body take in urlencoded
auth.use(urlencoded({
    extended: true
}));
 
// Authenticate

auth.post('/authenticate/:userid', async (req: Request, res: Response, next: any) => {
    
    console.log(req)
    if (req.body == undefined) {
        res.status(403);
        res.send("No payload sent with request");
        console.log('Exiting because no body')
        return;
    }

    if (!req.body.hasOwnProperty('password')) {
        res.status(403);
        res.send("Payload does not contain a password");
        return;
    }

    let username = req.params.userid;
    let pass = req.body['password'];

    console.log('authenticating %s', username);

    try {
        let authentication = await Utils.authenticate(username, pass, constants.USER_DB_POOL)
        if (authentication) {
            res.status(200);
            console.log("%s authenticated", username);
            res.send("User authenticated");
            return;
        } else {
            res.status(401);
            console.log("Failed authentication for %s", username);
            res.send("Password is incorrect");
            return;
        }
    } 
    catch (err) {
        if (err.name == Errors.NotFoundError.name) {
            console.log("Username %s does not exist.", username);
            res.status(403);
            res.send("Username does not exist");
            return;
        }

        // Any other error is most likely serverside
        throw err;
    }
});

// User insertion

auth.post('/new/:userid', async (req: Request, res: Response, next: any) => {
    if (!req.body) {
        res.status(402);
        res.send("No payload sent with request");
    }

    console.log(`Inserting ${req.params.userid}`);

    if (!req.body.hasOwnProperty('password')) {
        res.status(401);
        res.send("Payload does not contain a password");
        return;
    }

    if (!req.body.hasOwnProperty('email')) {
        res.status(401);
        res.send("Payload does not contain a email");
        return;
    }

    let username = req.params.userid;
    console.log(username)
    let name = req.body.hasOwnProperty('name') ? req.body['name'] : null;
    let email = req.body['email'];
    let password = req.body['password'];

    await Utils.insertUser(username, name, email, password, constants.USER_DB_POOL);

    res.status(200);
    res.send('Inserted user!');
});

// Edit information

auth.put('/edit/:userid', async (req: Request, res: Response, next: any) => {

    if (!req.body) {
        res.status(402);
        res.send("No payload sent with request");
    }

    console.log('editing');

    let username = req.params.userid;
    let newUsername = req.body.hasOwnProperty('newUsername') ? req.body['newUsername'] : null;
    let name = req.body.hasOwnProperty('name') ? req.body['name'] : null;
    let email = req.body.hasOwnProperty('email') ? req.body['email'] : null;
    let password = req.body.hasOwnProperty('password') ? req.body['password'] : null;

    try {
        await Utils.editUserInfo(username, newUsername, name, email, password, constants.USER_DB_POOL);
    }
    catch (err) {
        if (err.name == Errors.NotFoundError.name) {
            res.status(403);
            res.send('Username does not exist.');
            return;
        }
    }

    res.status(200);
    res.send('Edited information!');

});

auth.listen(3000, () => {
    console.log('Listening on port 3000!')
});