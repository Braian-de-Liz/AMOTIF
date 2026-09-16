import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } from './config.enviriment.js';

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

async function sendEmail(to: string, subject: string, html: string) {
    if (!SMTP_HOST || !SMTP_USER) {
        console.warn("AVISO: SMTP não configurado. Email não enviado.");
        return null;
    }

    return transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to,
        subject,
        html
    });
}

export { sendEmail };
