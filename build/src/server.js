"use strict";
/**
 * Dependencies
 * Heavily inspired by
 *     https://github.com/expressjs/express/blob/master/examples/auth/index.js
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
Object.defineProperty(exports, "__esModule", { value: true });
const db_utils_1 = require("./db_utils");
const Errors = __importStar(require("./errors"));
var express = require('../..');
var session = require('express-session');
var auth = module.exports = express();
// config -- TODO: Add configuration parameters to auth
// middleware
auth.use(express.urlencoded({ extended: false }));
auth.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'secret'
}));
// Session-persisted message middleware
auth.use(function (req, res, next) {
    var err = req.session.error;
    var msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err)
        res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg)
        res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});
// Authenticate
auth.post('/:userId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body) {
        res.send("No payload sent with request");
    }
    if (!req.body.hasOwnProperty('password')) {
        res.send("Payload does not contain a password");
    }
    let username = req.params.userId;
    let pass = req.body['password'];
    console.log('authenticating %s', username);
    try {
        let authentication = yield db_utils_1.authenticate(username, pass);
        if (authentication) {
            res.status(200);
            console.log("%s authenticated", username);
            res.send("User authenticated");
        }
        else {
            res.status(403);
            console.log("Failed authentication for %s", username);
            res.send("Password is incorrect");
        }
    }
    catch (err) {
        if (err.name == Errors.NotFoundError.name) {
            console.log("Username %s does not exist.", username);
            res.status(403);
            res.send("Username does not exist");
        }
        // Any other error is most likely serverside
        throw err;
    }
}));
// Pass up the router
exports.default = auth;
