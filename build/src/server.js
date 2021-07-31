"use strict";
/**
 * Main entry point for the authentication server
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const Utils = __importStar(require("./db_utils"));
const constants_1 = require("./constants");
const Errors = __importStar(require("./errors"));
let auth = express_1.default();
// Let body take in urlencoded
auth.use(body_parser_1.urlencoded({
    extended: true
}));
// Authenticate
auth.post('/authenticate/:userid', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req);
    if (req.body == undefined) {
        res.status(403);
        res.send("No payload sent with request");
        console.log('Exiting because no body');
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
        let authentication = yield Utils.authenticate(username, pass, constants_1.constants.USER_DB_POOL);
        if (authentication) {
            res.status(200);
            console.log("%s authenticated", username);
            res.send("User authenticated");
            return;
        }
        else {
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
}));
// User insertion
auth.post('/new/:userid', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
    console.log(username);
    let name = req.body.hasOwnProperty('name') ? req.body['name'] : null;
    let email = req.body['email'];
    let password = req.body['password'];
    yield Utils.insertUser(username, name, email, password, constants_1.constants.USER_DB_POOL);
    res.status(200);
    res.send('Inserted user!');
}));
// Edit information
auth.put('/edit/:userid', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield Utils.editUserInfo(username, newUsername, name, email, password, constants_1.constants.USER_DB_POOL);
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
}));
auth.listen(3000, () => {
    console.log('Listening on port 3000!');
});
