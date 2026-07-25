import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE, // "true" für Port 465
  MAIL_FROM,
  NOTIFY_EMAIL = "jan@kaderplus.de",
} = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Ohne Timeouts hängt der Versand minutenlang, wenn der Host SMTP-Ports blockt
    // (z. B. Render Free-Tier sperrt 25/465/587).
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

const from = MAIL_FROM || `Kaderplus <${SMTP_USER || "no-reply@kaderplus.de"}>`;

export const emailConfigured = isConfigured;
export const notifyAddress = NOTIFY_EMAIL;

async function send({ to, subject, text, replyTo }) {
  if (!transporter) return { skipped: true };
  await transporter.sendMail({ from, to, subject, text, replyTo });
  return { skipped: false };
}

function formatFields(fields) {
  return Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

// Benachrichtigung an das Kaderplus-Postfach
export function sendNotification({ subject, fields, replyTo }) {
  return send({
    to: NOTIFY_EMAIL,
    subject,
    text: `Neue Anfrage über kaderplus.de:\n\n${formatFields(fields)}`,
    replyTo,
  });
}

// Eingangsbestätigung an den Absender
export function sendConfirmation({ to, name }) {
  return send({
    to,
    subject: "Ihre Anfrage bei Kaderplus ist eingegangen",
    text: `Hallo ${name || ""},

vielen Dank für Ihre Nachricht an Kaderplus. Wir haben Ihre Anfrage erhalten und melden uns in der Regel innerhalb von 24 Stunden.

Sportliche Grüße
Kaderplus – Das Team hinter dem Team`,
  });
}
