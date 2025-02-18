import nodemailer from 'nodemailer';

import { logger } from './util/logging.util.js'

export const sendMail = async (to: string, subject: string, html: string) => {
    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        secure: true,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD
        }
    });


    const mailOptions = {
        from: process.env.MAIL_FROM,
        to: to,
        replyTo: process.env.MAIL_REPLY,
        subject: subject,
        html: html
    };

    logger.info(`Sending mail to - ${to}`);
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error);
        } else {
            logger.info('Email sent: ' + info.response);
        }
    });
};

export const sendMailDefault = async (to: string, loginTime: string) => {
    const subject = 'Alert: Account Login Detected';
    const html = `
        <p>Hello,</p>
        <p>Someone has logged into your account.</p>
        <p><strong>Time of Login:</strong> ${loginTime}</p>
        <p>If this wasn't you, please secure your account immediately.</p>
        <p>Regards,<br>Your Audit Team</p>
    `;

    logger.info(`Preparing to send default email to - ${to}`);
    await sendMail(to, subject, html);
};


// TODO: Implementierung des Invite-Emails
export const sendMailInvite = async (to: string, fullName: string, adminName: string, registrationToken: string) => { // Vorbereitung für die Einladungsmail
    const subject = `${adminName} has invited you to join the platform!`;
    const html = `
        <p>Hello ${fullName},</p>
        <p>You have been invited to join our Platform.</p>
        <p>Click the following link if you want to create an account immediately:</p>
        <a href="http://localhost:5173/sign-up/${registrationToken}" style="
            display: inline-block;
            padding: 10px 20px;
            font-size: 16px;
            color: #ffffff;
            background-color: #4CAF50;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
        ">Join!</a> 
        <p>If this email wasn't meant for you, please ignore it.</p>
        <p>Can't wait to see you!</p>
    `;
    // (daweil ok) UNBEDINGT ZU FRONTEND UMLEITEN NICHT BACKEND!!!!!
    logger.info(`Preparing to send Invite email to - ${to}`);
    await sendMail(to, subject, html);
};
