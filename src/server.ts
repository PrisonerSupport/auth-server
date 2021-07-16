/**
 * Dependencies
 * Heavily inspired by 
 *     https://github.com/expressjs/express/blob/master/examples/auth/index.js
 */

import express, { Request, Response } from 'express';

import { authenticate } from './db_utils';
import * as Errors from './errors';

 let auth = express()
 
 // Authenticate

 auth.post('/:userId', async (req: Request, res: Response, next: any) => {
     if (!req.body) {
         res.send("No payload sent with request");
     }

     if (!req.body.hasOwnProperty('password')) {
         res.status(401);
         res.send("Payload does not contain a password");
     }

     let username = req.params.userId
     let pass = req.body['password'];

     console.log('authenticating %s', username);

     try {
         let authentication = await authenticate(username, pass);
         if (authentication) {
             res.status(200);
             console.log("%s authenticated", username)
             res.send("User authenticated")
         } else {
             res.status(403);
             console.log("Failed authentication for %s", username);
             res.send("Password is incorrect");
         }
     } catch (err) {
        if (err.name == Errors.NotFoundError.name) {
            console.log("Username %s does not exist.", username);
            res.status(403);
            res.send("Username does not exist");
        }

        // Any other error is most likely serverside
        throw err;
     }
 })

 // User insertion and deletion
auth.put('/:userId', async (req: Request, res: Response, next: any) => {

    if (!req.body) {
        res.status(402);
        res.send("No payload sent with request");
    }
    


})