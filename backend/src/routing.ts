import express from 'express';
import cookieParser from 'cookie-parser';
import { validateEmail, validateName, validatePassword } from './util/validation.util.js';
import { CreateRegistrationToken, DeleteRegistrationTokens, DeleteOrRestoreUser, GetAllRegistrationTokens, GetAllUsersAdminView, login, SessionToUser, Register, Logout, IsFirstRegistration, RegisterFirstAdmin } from './database.js';
import { sendMailDefault, sendMailInvite } from './mailService.js';
import cors from 'cors'

const cookieName = 'gruppe2session';

export const expressApp = express();

expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(cookieParser());

expressApp.post('/login', async (req, res) => {
    const body = {
        email: req.body.email,
        password: req.body.password
    }

    const errors = {
        email: validateEmail(body.email),
        password: validatePassword(body.password)
    }

    if (Object.values(errors).some(Boolean)) {
        res.status(400).json(errors);
        return;
    }

    const loginResult = await login(body.email, body.password);

    if (loginResult instanceof Error) {
        res.status(400).json({ message: loginResult.message });
        return;
    } else if (typeof loginResult === 'string') {
        //removed for testing
        //sendMailDefault(body.email, Date()) // send the login notification
        res.status(200).cookie(cookieName, loginResult, { httpOnly: true }).json({ message: "Login was successful" });
        return;
    }
});

expressApp.post('/logout', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(401).json({ message: "Invalid sessionId" });
        return;
    }

    const result = await Logout(sessionId);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});


expressApp.get('/users/querySessionowner', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(401).json({ message: "Invalid sessionId" });
        return;
    }

    const result = await SessionToUser(sessionId);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.get('/registration/IsFirstRegistration', async (req, res) => {
    const result = await IsFirstRegistration();

    res.status(200).json({ IsFirstRegistration: result });
    return;
});

expressApp.post('/registration/FirstRegistration', async (req, res) => {
    const body = {
        u_firstname: req.body.u_firstname,
        u_lastname: req.body.u_lastname,
        u_email: req.body.u_email,
        password: req.body.password
    }

    const errors = {
        u_firstname: validateName(body.u_firstname),
        u_lastname: validateName(body.u_lastname),
        u_email: validateEmail(body.u_email),
        password: validatePassword(body.password)
    }

    if (Object.values(errors).some(Boolean)) {
        res.status(400).json(errors);
        return;
    }

    const registrationResult = await RegisterFirstAdmin({ u_firstname: body.u_firstname, u_lastname: body.u_lastname, u_email: body.u_email, inputPassword: body.password });

    if (registrationResult instanceof Error) {
        res.status(400).json({ message: registrationResult.message });
        return;
    } else {
        res.status(200).cookie(cookieName, registrationResult.sessionToken, { httpOnly: true }).json({ message: registrationResult.message });
        return;
    }
});

expressApp.get('/users/adminView', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(401).json({ message: "Invalid sessionId" });
        return;
    }

    const result = await GetAllUsersAdminView(sessionId);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.delete('/users/deleteUser', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(401).json({ message: "Invalid sessionId" });
        return;
    }

    if (!req.body.u_userId || typeof req.body.u_userId !== 'string' || req.body.u_userId.length !== 64) {
        res.status(400).json({ message: "Invalid u_userId" });
        return;
    }

    const result = await DeleteOrRestoreUser(sessionId, req.body.u_userId, true);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.post('/users/restoreUser', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(400).json({ message: "Invalid sessionId" });
        return;
    }

    if (!req.body.u_userId || typeof req.body.u_userId !== 'string' || req.body.u_userId.length !== 64) {
        res.status(400).json({ message: "Invalid u_userId" });
        return;
    }

    const result = await DeleteOrRestoreUser(sessionId, req.body.u_userId, false);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.post('/registration/createInvitation', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    const inputBody = {
        rp_firstname: req.body.rp_firstname,
        rp_lastname: req.body.rp_lastname,
        rp_email: req.body.rp_email,
    }

    if (!sessionId) {
        res.status(400).json({ message: "Invalid sessionId" });
        return;
    }

    const result = await CreateRegistrationToken(sessionId, inputBody.rp_firstname, inputBody.rp_lastname, inputBody.rp_email);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.get('/registration/viewTokens', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(400).json({ message: "Invalid sessionId" });
        return;
    }

    const result = await GetAllRegistrationTokens(sessionId);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.delete('/registration/deleteAllTokens', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(400).json({ message: "Invalid sessionId" });
        return;
    }

    const result = await DeleteRegistrationTokens(sessionId, null);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.delete('/registration/deleteToken', async (req, res) => {
    const sessionId = req.cookies[cookieName];

    if (!sessionId) {
        res.status(400).json({ message: "Invalid sessionId" });
        return;
    }

    if (!req.body.deleteToken || typeof req.body.deleteToken !== 'string' || req.body.deleteToken.length !== 64) {
        res.status(400).json({ message: "Invalid deleteToken" });
        return;
    }

    const result = await DeleteRegistrationTokens(sessionId, req.body.deleteToken);

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
        return;
    } else {
        res.status(200).json(result);
        return;
    }
});

expressApp.post('/registration/register', async (req, res) => {
    const body = {
        registrationToken: req.body.registrationToken,
        password: req.body.password
    }

    const errors = {
        registrationToken: (!req.body.registrationToken || typeof req.body.registrationToken !== 'string' || req.body.registrationToken.length !== 64) ? "invalid registrationToken" : undefined,
        password: validatePassword(body.password)
    }

    if (Object.values(errors).some(Boolean)) {
        res.status(400).json(errors);
        return;
    }

    const registrationResult = await Register(body.registrationToken, body.password);

    if (registrationResult instanceof Error) {
        res.status(400).json({ message: registrationResult.message });
        return;
    } else {
        res.status(200).cookie(cookieName, registrationResult.sessionToken, { httpOnly: true }).json({ message: registrationResult.message });
        return;
    }
});