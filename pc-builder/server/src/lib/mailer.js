import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransport() {
  if (!env.smtpHost) return null;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
  });
}

const transport = createTransport();

export async function sendMail({ to, subject, html, text }) {
  if (!transport) {
    console.info('[mail:dev]', { to, subject, text, html });
    return { queued: false, logged: true };
  }
  await transport.sendMail({ from: env.smtpFrom, to, subject, html, text });
  return { queued: true };
}
