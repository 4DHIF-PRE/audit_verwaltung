import express from 'express';
import cookieParser from 'cookie-parser';
import { validateEmail, validateName, validatePassword } from './util/validation.util.js';
//Mein Lieblings-Import
import { CreateRegistrationToken, DeleteRegistrationTokens, DeleteOrRestoreUser, GetAllRegistrationTokens, GetAllUsersAdminView, login, SessionToUser, Register, Logout, IsFirstRegistration, RegisterFirstAdmin, GetAllFindings, getFindingByQuestionID, getAuditQuestions, createFinding, updateFinding, deleteFinding, getFindingsByID, uploadAttachment, getFileNameByFindingId, getFilesByFindingId, deleteFileByFindingAttachmentId, getFileByFindingAttachmentId, CreateLaw, GetAllLaws, GetLawById, UpdateLaw, DeleteLaw, CreateAudit, GetAllAudits, GetAuditById, UpdateAudit, DeleteAudit, CreateQuestion, GetAllQuestions, GetQuestionById, UpdateQuestion, DeleteQuestion, GetQuestionByAuditAndLaw, UpdateAuditStatus, GetFindingWorkOnById, CreateFindingWorkOn, GetWorkOnById, GetRolesUser, AddRoleForAudit, GetAllUser } from './database.js';

import { sendMailDefault, sendMailInvite } from './mailService.js';
import cors from 'cors'

const cookieName = 'gruppe2session';

export const expressApp = express();

expressApp.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,  
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Cookie']
}));
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

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
    } else if (typeof loginResult === 'object') {
        //removed for testing
        //sendMailDefault(body.email, Date()) // send the login notification
        res.status(200).cookie(cookieName, loginResult.sessionId, { httpOnly: true, expires: loginResult.expiresAt }).json({ message: "Login was successful" });
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

//wer das liest is ein sigma (:

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

expressApp.get('/findings/getall', async (req, res) => {

    const result = await GetAllFindings();

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

//gruppe 4
// GET alle questions von einem audit
expressApp.get('/audit/questions/:id', async (req, res) => {
    const auditId = req.params.id;

    // AuditId must be number

    try {
        const results = await getAuditQuestions(parseInt(auditId));

        if (results instanceof Error) {
            return res.status(500).json({ error: results.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No questions found for this audit.' });
        }

        res.status(200).json(results);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }

});

// POST einen neuen Finding zu einem Audit ( Finding erstellen )
expressApp.post('/audit/finding', async (req, res) => {

    const findingData = req.body;
    try {
        const result = await createFinding(findingData);
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }
        res.status(201).json({ message: 'Finding created', findingId: result });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT eines Findings von einem Audit ( Finding aktualisieren )
expressApp.put('/audit/finding', async (req, res) => {
    const updateData = req.body;
    //console.log("Update Data before updateFinding:")
    // console.log(updateData)
    try {
        const result = await updateFinding(updateData);
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }
        res.json({ message: 'Finding updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// DELETE eine Finding
expressApp.delete('/audit/finding/:id', async (req, res) => {
    // const findingId:number = parseInt(req.params.id);
    try {
        const result = await deleteFinding(parseInt(req.params.id));
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }
        res.json({ message: 'Finding deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Findings

expressApp.get('/api/audit/findings/:id', async (req, res) => {
    try {
        const auditId = parseInt(req.params.id, 10);
        if (isNaN(auditId)) {
            return res.status(400).json({ error: 'Invalid audit ID' });
        }

        const results = await getFindingsByID(auditId);
        if (results instanceof Error) {
            console.error('Error fetching findings:', results.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.json(results);
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

//get findings by id
expressApp.get('/api/questions/:id/finding', async (req, res) => {
    try {
        const questionId = parseInt(req.params.id, 10); // Parse the ID from the request URL
        if (isNaN(questionId)) {
            return res.status(400).json({ error: 'Invalid question ID' });
        }

        const finding = await getFindingByQuestionID(questionId); // Fetch one finding instead of multiple
        if (finding instanceof Error) {
            console.error('Error fetching finding:', finding.message);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.json(finding); // Send the single finding as JSON
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});



// upload file name
expressApp.post('/api/finding/attachments/:id/:fileName', async (req, res) => {
    try {
        const findingId = req.params.id;
        const fileName = req.params.fileName;

        // Check if the request contains data
        if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
            return res.status(400).json({ error: 'Invalid content-type. Expected multipart/form-data.' });
        }

        // Collect the file data
        let fileData = Buffer.alloc(0);
        req.on('data', (chunk) => {
            fileData = Buffer.concat([fileData, chunk]);
        });

        req.on('end', async () => {
            if (fileData.length === 0) {
                return res.status(400).json({ error: 'No file uploaded.' });
            }

            // Save the file to the database
            const attachmentId = await uploadAttachment(findingId, fileData, fileName);
            if (attachmentId instanceof Error) {
                console.error('Error inserting file:', attachmentId);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            return res.status(201).json({ message: 'File uploaded successfully', attachmentId });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


// get Filenamen
expressApp.get('/api/finding/attachments/:id/filenames', async (req, res) => {
    const findingId = req.params.id;

    try {
        const fileName = await getFileNameByFindingId(findingId);

        if (fileName instanceof Error) {
            return res.status(404).json({ error: fileName.message });
        }

        return res.json({ fileName });
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// get Files
expressApp.get('/api/finding/attachments/:id/files', async (req, res) => {
    const findingId = req.params.id;

    try {
        const fileName = await getFilesByFindingId(findingId);

        if (fileName instanceof Error) {
            return res.status(404).json({ error: fileName.message });
        }

        return res.json({ fileName });
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// get File
expressApp.get('/api/finding/attachments/:id', async (req, res) => {
    const attachmentId = req.params.id;

    try {
        const fileName = await getFileByFindingAttachmentId(attachmentId);

        if (fileName instanceof Error) {
            return res.status(404).json({ error: fileName.message });
        }

        return res.json({ fileName });
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// delete file
expressApp.get('/api/finding/attachments/:id/delete', async (req, res) => {
    const attachmentId = req.params.id;

    try {
        const fileName = await deleteFileByFindingAttachmentId(attachmentId);

        if (fileName instanceof Error) {
            return res.status(404).json({ error: fileName.message });
        }

        return res.json({ fileName });
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
// Gruppe3
expressApp.post('/law', async (req, res) => {
    const { la_law, la_typ, la_description, la_text, la_valid_from, la_valid_until } = req.body;
    const errors = {
        la_law: (!la_law || typeof la_law !== 'string') ? "Invalid la_law" : undefined,
        la_typ: (!la_typ || ['r', 'amc', 'gm', 's'].indexOf(la_typ) === -1) ? "Invalid la_typ" : undefined,
        la_description: (!la_description || typeof la_description !== 'string') ? "Invalid la_description" : undefined,
        la_valid_from: (!la_valid_from) ? "Invalid la_valid_from" : undefined,
        la_valid_until: (!la_valid_until) ? "Invalid la_valid_until" : undefined,
    };
    if (Object.values(errors).some(Boolean)) {
        res.status(400).json(errors);
        return;
    }
    const result = await CreateLaw({ la_law, la_typ, la_description, la_text, la_valid_from, la_valid_until });
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(201).json(result);
    }
});
expressApp.get('/law', async (req, res) => {
    const result = await GetAllLaws();
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});
expressApp.get('/law/:id', async (req, res) => {
    const lawId = req.params.id;
    const result = await GetLawById(+lawId);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});
expressApp.put('/law/:id', async (req, res) => {
    const lawId = req.params.id;
    const updates = req.body;
    const result = await UpdateLaw(+lawId, updates);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});
expressApp.delete('/law/:id', async (req, res) => {
    const lawId = req.params.id;
    const result = await DeleteLaw(+lawId);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(204).send();
    }
});

        // Routes for audit
        expressApp.post('/audit', async (req, res) => {
            const {
                au_audit_date,
                au_number_of_days,
                au_leadauditor_idx,
                au_auditstatus,
                au_place,
                au_theme,
                au_typ
            } = req.body;
            const errors = {
                au_audit_date: !au_audit_date ? "Invalid au_audit_date" : undefined,
                au_number_of_days: (!au_number_of_days && au_number_of_days !== 0) ? "Invalid au_number_of_days" : undefined,
                au_leadauditor_idx: !au_leadauditor_idx ? "Invalid au_leadauditor_idx" : undefined,
                au_auditstatus: !['geplant', 'bereit', 'begonnen', 'findings_offen', 'fertig'].includes(au_auditstatus) ? "Invalid au_auditstatus" : undefined,
                au_place: !au_place ? "Invalid au_place" : undefined,
                au_theme: !au_theme ? "Invalid au_theme" : undefined,
                au_typ: !['audit', 'inspektion', 'ca', 'extern', 'sonstig'].includes(au_typ) ? "Invalid au_typ" : undefined,
            };
            if (Object.values(errors).some(Boolean)) {
                res.status(400).json(errors);
                return;
            }
            const result = await CreateAudit({
                au_audit_date,
                au_number_of_days,
                au_leadauditor_idx,
                au_auditstatus,
                au_place,
                au_theme,
                au_typ,
            });
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(201).json(result);
            }
        });

        expressApp.get('/audit', async (req, res) => {
            const result = await GetAllAudits();
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });


        expressApp.get('/audit/:id', async (req, res) => {
            const auditId = req.params.id;
            const result = await GetAuditById(+auditId);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.put('/audit/:id', async (req, res) => {
            const auditId = req.params.id;
            const updates = req.body;
            const result = await UpdateAudit(+auditId, updates);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });

expressApp.delete('/audit/:id', async (req, res) => {
    const auditId = req.params.id;
    const result = await DeleteAudit(+auditId);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(204).send();
    }
});

expressApp.patch('/audit/:id/status', async (req, res) => {
    const auditId = req.params.id;
    const { au_auditstatus } = req.body;

    if (!['geplant', 'bereit', 'begonnen', 'findings_offen', 'fertig'].includes(au_auditstatus)) {
        return res.status(400).json({ message: "Invalid au_auditstatus" });
    }

    try {
        const result = await UpdateAuditStatus(+auditId, au_auditstatus);
        if (result instanceof Error) {
            return res.status(400).json({ message: result.message });
        }
        res.status(200).json({ message: "Audit status updated", auditId, newStatus: au_auditstatus });
    } catch (error) {
        console.error("Error updating audit status:", error);
        res.status(500).json({ message: "Error updating audit status" });
    }
});

// Routes for questions
expressApp.post('/questions', async (req, res) => {
    const { qu_audit_idx, qu_law_idx, qu_audited, qu_applicable, qu_finding_level } = req.body;
    const errors = {
        qu_audit_idx: !qu_audit_idx ? "Invalid qu_audit_idx" : undefined,
        qu_law_idx: !qu_law_idx ? "Invalid qu_law_idx" : undefined,
        qu_audited: typeof qu_audited !== 'boolean' ? "Invalid qu_audited" : undefined,
        qu_applicable: typeof qu_applicable !== 'boolean' ? "Invalid qu_applicable" : undefined,
        qu_finding_level: qu_finding_level !== undefined && typeof qu_finding_level !== 'number' ? "Invalid qu_finding_level" : undefined,
    };
    if (Object.values(errors).some(Boolean)) {
        res.status(400).json(errors);
        return;
    }

    const result = await CreateQuestion({
        qu_audit_idx,
        qu_law_idx,
        qu_audited,
        qu_applicable,
        qu_finding_level,
    });

    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(201).json(result);
    }
});

expressApp.get('/questions', async (req, res) => {
    const result = await GetAllQuestions();
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});

expressApp.get('/questions/:id', async (req, res) => {
    const questionId = req.params.id;
    const result = await GetQuestionById(+questionId);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});

expressApp.put('/questions/:id', async (req, res) => {
    const questionId = req.params.id;
    const updates = req.body;
    const result = await UpdateQuestion(+questionId, updates);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});

expressApp.delete('/questions/:id', async (req, res) => {
    const questionId = parseInt(req.params.id, 10);
    if (isNaN(questionId)) {
        return res.status(400).json({ message: "Invalid question ID" });
    }
});
expressApp.get('/findings/workon/:id', async (req, res) => {
    const findingWorkOnId = req.params.id;
    const result = await GetFindingWorkOnById(+findingWorkOnId);
    if (result instanceof Error) {
        res.status(400).json({ message: result.message });
    } else {
        res.status(200).json(result);
    }
});

expressApp.post('/findings/workon/:id', async (req, res) => {
    const workon = req.body;
    const findingId = req.params.id;

    if (!Array.isArray(workon)) {
        return res.status(400).json({ message: "Invalid data format, expected an array of workon data." });
    }

    try {
        const createdWorkOns = [];

        for (const finding of workon) {
            const result = await CreateFindingWorkOn(findingId, finding.comment);
            if (result instanceof Error) {
                console.error("Error creating workon:", result.message);
            } else {
                createdWorkOns.push(result);
            }
        }

        res.status(201).json({ created: createdWorkOns.length, data: createdWorkOns });
    } catch (error) {
        console.error("Error saving workons:", error);
        res.status(500).json({ message: "Error saving workon data", error: error.message });
    }
});


expressApp.post('/questions/bulk', async (req, res) => {
    const questions = req.body;

    if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid data format" });
    }

    try {
        const createdQuestions = [];

        for (const question of questions) {
            const existingQuestion = await GetQuestionByAuditAndLaw(
                question.qu_audit_idx,
                question.qu_law_idx
            );

            if (!existingQuestion) {
                const result = await CreateQuestion(question);
                if (result instanceof Error) {
                    console.error("Error creating question:", result.message);
                } else {
                    createdQuestions.push(result);
                }
            }
        }

        res.status(201).json({ created: createdQuestions.length });
    } catch (error) {
        res.status(500).json({ message: "Error saving questions", error });
    }
});

expressApp.post('/rolesuser', async (req, res) => {
            const { userId, auditId } = req.body;
            const result = await AddRoleForAudit(userId, auditId);
        
            if (result instanceof Error) {
                res.status(400).json({ message: result.message });
            } else {
                res.status(201).json({ message: "Role successfully added." });
            }
           });

            expressApp.get('/rolesuser', async (req, res) => {
                const result = await GetRolesUser();
                if (result instanceof Error) {
                    res.status(400).json({message: result.message});
                } else {
                    res.status(200).json(result);
                }
});

expressApp.get('/getalluser', async (req, res) => {
    const result = await GetAllUser();
    if(result instanceof Error){
        res.status(400).json({message: result.message});
    }else{
        res.status(200).json(result);
    }
});