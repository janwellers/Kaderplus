import nodemailer from "nodemailer";

const {
  BREVO_API_KEY,
  RESEND_API_KEY,
  SMTP_HOST,
  SMTP_PORT = "587",
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE, // "true" für Port 465
  MAIL_FROM,
  NOTIFY_EMAIL = "jan@kaderplus.de",
} = process.env;

// Brevo und Resend versenden über HTTPS und funktionieren daher auch dort, wo
// ausgehende SMTP-Ports gesperrt sind (z. B. Render Free-Tier). Reihenfolge:
// Brevo → Resend → SMTP.
const useBrevo = Boolean(BREVO_API_KEY);
const useResend = !useBrevo && Boolean(RESEND_API_KEY);
const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const useSmtp = !useBrevo && !useResend && smtpConfigured;

let transporter = null;
if (useSmtp) {
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

// "Kaderplus <info@kaderplus.de>" → { name, email } (Brevo will beide getrennt)
function parseFrom(value) {
  const match = value.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return match
    ? { name: match[1] || "Kaderplus", email: match[2] }
    : { name: "Kaderplus", email: value.trim() };
}
const sender = parseFrom(from);

export const emailConfigured = useBrevo || useResend || useSmtp;
export const emailBackend = useBrevo
  ? "brevo"
  : useResend
    ? "resend"
    : useSmtp
      ? "smtp"
      : "none";
export const notifyAddress = NOTIFY_EMAIL;

async function sendViaBrevo({ to, subject, text, replyTo }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender,
      to: [{ email: to }],
      subject,
      textContent: text,
      ...(replyTo ? { replyTo: { email: replyTo } } : {}),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Brevo ${res.status}: ${detail.slice(0, 300)}`);
  }
}

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
  if (useBrevo) {
    await sendViaBrevo({ to, subject, text, replyTo });
    return { skipped: false };
  }
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
