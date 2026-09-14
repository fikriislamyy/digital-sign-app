import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 1025);
const from = process.env.MAIL_FROM ?? 'SignCraft <no-reply@signcraft.local>';

const transport = host ? nodemailer.createTransport({ host, port, secure: false }) : null;

if (!transport) {
  console.warn('[mail.service] SMTP_HOST is not set. Emails will be printed here, not sent.');
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  if (!transport) {
    console.log(`[mail.service] To: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`);
    return;
  }
  await transport.sendMail({ from, ...message });
}

export async function checkMailTransport(): Promise<boolean> {
  if (!transport) return false;
  return transport.verify();
}
