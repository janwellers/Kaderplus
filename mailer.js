import nodemailer from "nodemailer";

const {
  RESEND_API_KEY,
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE, // "true" für Port 465
  MAIL_FROM,
  NOTIFY_EMAIL = "jan@kaderplus.de",
} = process.env;

// Resend versendet über HTTPS und funktioniert daher auch dort, wo ausgehende
// SMTP-Ports gesperrt sind (z. B. Render Free-Tier). SMTP bleibt als Fallback.
const useResend = Boolean(RESEND_API_KEY);
const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter = null;
if (!useResend && smtpConfigured) {
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

export const emailConfigured = useResend || smtpConfigured;
export const emailBackend = useResend ? "resend" : smtpConfigured ? "smtp" : "none";
export const notifyAddress = NOTIFY_EMAIL;

async function sendViaResend({ to, subject, text, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 300)}`);
  }
}

async function send({ to, subject, text, replyTo }) {
  if (useResend) {
    await sendViaResend({ to, subject, text, replyTo });
    return { skipped: false };
  }
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
