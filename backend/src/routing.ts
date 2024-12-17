import express from 'express';
import cookieParser from 'cookie-parser';
import { validateEmail, validateName, validatePassword } from './util/validation.util.js';
import { CreateRegistrationToken, DeleteRegistrationTokens, DeleteOrRestoreUser, GetAllRegistrationTokens, GetAllUsersAdminView, login, SessionToUser, Register, Logout, IsFirstRegistration, RegisterFirstAdmin, GetAllFindings,getAuditQuestions,createFinding, updateFinding, deleteFinding, getFindingsByID,uploadAttachment,getFileNameByFindingId,getFilesByFindingId,deleteFileByFindingAttachmentId,getFileByFindingAttachmentId, CreateLaw, GetAllLaws, GetLawById, UpdateLaw, DeleteLaw, CreateAudit, GetAllAudits, GetAuditById, UpdateAudit, DeleteAudit, CreateQuestion, GetAllQuestions, GetQuestionById, UpdateQuestion, DeleteQuestion } from './database.js';
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
        const results = await getAuditQuestions( parseInt(auditId) );

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
        const result = await deleteFinding( parseInt(req.params.id));
        if (result instanceof Error) {
            return res.status(500).json({ error: result.message });
        }
        res.json({ message: 'Finding deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET Findings
expressApp.get('/api/audit/findings/:id'), (req, res) => {
   
    try {
        const results = getFindingsByID(req.params.id)
        if (results instanceof Error) {
            console.error('Error executing query');
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.json(results);
    }catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
    
}

// get file name
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
            return res.status(404).json({error: fileName.message});
        }

        return res.json({fileName});
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({error: "Internal Server Error"});
    }
});
// Gruppe3
        expressApp.post('/law', async (req, res) => {
            const {la_law, la_typ, la_description, la_text, la_valid_from, la_valid_until} = req.body;
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
            const result = await CreateLaw({la_law, la_typ, la_description, la_text, la_valid_from, la_valid_until});
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(201).json(result);
            }
        });
        expressApp.get('/law', async (req, res) => {
            const result = await GetAllLaws();
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.get('/law/:id', async (req, res) => {
            const lawId = req.params.id;
            const result = await GetLawById(+lawId);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.put('/law/:id', async (req, res) => {
            const lawId = req.params.id;
            const updates = req.body;
            const result = await UpdateLaw(+lawId, updates);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.delete('/law/:id', async (req, res) => {
            const lawId = req.params.id;
            const result = await DeleteLaw(+lawId);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
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
                au_leadauditee_idx,
                au_auditstatus,
                au_place,
                au_theme,
                au_typ
            } = req.body;
            const errors = {
                au_audit_date: !au_audit_date ? "Invalid au_audit_date" : undefined,
                au_number_of_days: (!au_number_of_days && au_number_of_days !== 0) ? "Invalid au_number_of_days" : undefined,
                au_leadauditor_idx: !au_leadauditor_idx ? "Invalid au_leadauditor_idx" : undefined,
                au_leadauditee_idx: !au_leadauditee_idx ? "Invalid au_leadauditee_idx" : undefined,
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
                au_leadauditee_idx,
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
                res.status(400).json({message: result.message});
            } else {
                res.status(204).send();
            }
        });
// Routes for questions
        expressApp.post('/questions', async (req, res) => {
            const {qu_audit_idx, qu_law_idx, qu_audited, qu_applicable, qu_finding_level} = req.body;
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
                res.status(400).json({message: result.message});
            } else {
                res.status(201).json(result);
            }
        });
        expressApp.get('/questions', async (req, res) => {
            const result = await GetAllQuestions();
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.get('/questions/:id', async (req, res) => {
            const questionId = req.params.id;
            const result = await GetQuestionById(+questionId);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.put('/questions/:id', async (req, res) => {
            const questionId = req.params.id;
            const updates = req.body;
            const result = await UpdateQuestion(+questionId, updates);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(200).json(result);
            }
        });
        expressApp.delete('/questions/:id', async (req, res) => {
            const questionId = req.params.id;
            const result = await DeleteQuestion(+questionId);
            if (result instanceof Error) {
                res.status(400).json({message: result.message});
            } else {
                res.status(204).send();
            }
        });