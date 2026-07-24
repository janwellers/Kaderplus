import "./env.js";
import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { sendNotification, sendConfirmation, emailConfigured } from "./mailer.js";
import {
  initStore,
  storageBackend,
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  createSubmission,
  listSubmissions,
} from "./store.js";
import {
  adminEnabled,
  adminUsesDevDefault,
  checkPassword,
  setAuthCookie,
  clearAuthCookie,
  requireAdmin,
  isAuthed,
} from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v, max = 2000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

// Versendet Benachrichtigung + Bestätigung; Fehler brechen die Anfrage nicht ab.
async function notify({ subject, fields, confirmTo, confirmName }) {
  try {
    await sendNotification({ subject, fields, replyTo: confirmTo });
    await sendConfirmation({ to: confirmTo, name: confirmName });
  } catch (err) {
    console.error("E-Mail-Versand fehlgeschlagen:", err.message);
  }
}

function jobFromBody(body) {
  return {
    title: clean(body.title, 160),
    category: clean(body.category, 120),
    club: clean(body.club, 160),
    location: clean(body.location, 120),
    employmentType: clean(body.employmentType, 80),
    description: clean(body.description, 5000),
    status: body.status === "closed" ? "closed" : "open",
  };
}

// ---------- Öffentliche API: Stellen ----------
app.get("/api/jobs", async (_req, res) => {
  const jobs = await listJobs({ includeClosed: false });
  res.json({ ok: true, jobs });
});

// ---------- Bewerbung (applicants) ----------
app.post("/api/apply", async (req, res) => {
  const name = clean(req.body.name, 120);
  const email = clean(req.body.email, 160);
  const message = clean(req.body.message, 2000);
  const jobId = clean(req.body.jobId, 80);

  let role = clean(req.body.role, 160);
  let job = null;
  if (jobId) {
    job = await getJob(jobId);
    if (job) role = job.title;
  }

  if (!name || !isEmail(email) || !role) {
    return res.status(400).json({
      ok: false,
      error: "Bitte Name, gültige E-Mail und gewünschte Position angeben.",
    });
  }

  await createSubmission({
    type: "application",
    jobId: job ? job.id : null,
    data: { name, email, role, message, jobTitle: job ? job.title : "" },
  });
  await notify({
    subject: `Neue Bewerbung: ${role} – ${name}`,
    fields: {
      Name: name,
      "E-Mail": email,
      Position: role,
      ...(job ? { Stelle: `${job.title} (${job.club || "Verein"})` } : {}),
      Kurzprofil: message,
    },
    confirmTo: email,
    confirmName: name,
  });
  return res.status(201).json({
    ok: true,
    message: "Danke! Deine Bewerbung ist eingegangen – wir melden uns.",
  });
});

// ---------- Bedarf melden (clubs) ----------
app.post("/api/request", async (req, res) => {
  const club = clean(req.body.club, 160);
  const contact = clean(req.body.contact, 120);
  const email = clean(req.body.email, 160);
  const position = clean(req.body.position, 120);
  const message = clean(req.body.message, 2000);

  if (!club || !contact || !isEmail(email) || !position) {
    return res.status(400).json({
      ok: false,
      error: "Bitte Verein, Ansprechpartner, gültige E-Mail und Position angeben.",
    });
  }

  await createSubmission({
    type: "club_request",
    data: { club, contact, email, position, message },
  });
  await notify({
    subject: `Neue Vereinsanfrage: ${position} – ${club}`,
    fields: { Verein: club, Ansprechpartner: contact, "E-Mail": email, Position: position, Details: message },
    confirmTo: email,
    confirmName: contact,
  });
  return res.status(201).json({
    ok: true,
    message: "Danke! Ihre Anfrage ist eingegangen – wir melden uns innerhalb von 24 Stunden.",
  });
});

// ---------- Admin-Authentifizierung ----------
app.get("/api/admin/session", (req, res) => {
  res.json({ ok: true, authenticated: isAuthed(req), adminEnabled });
});

app.post("/api/admin/login", (req, res) => {
  if (!adminEnabled) {
    return res.status(503).json({ ok: false, error: "Admin ist nicht konfiguriert (ADMIN_PASSWORD fehlt)." });
  }
  if (!checkPassword(clean(req.body.password, 200))) {
    return res.status(401).json({ ok: false, error: "Falsches Passwort." });
  }
  setAuthCookie(res);
  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// ---------- Admin-API: Stellen ----------
app.get("/api/admin/jobs", requireAdmin, async (_req, res) => {
  const jobs = await listJobs({ includeClosed: true });
  res.json({ ok: true, jobs });
});

app.post("/api/admin/jobs", requireAdmin, async (req, res) => {
  const data = jobFromBody(req.body);
  if (!data.title) {
    return res.status(400).json({ ok: false, error: "Titel ist erforderlich." });
  }
  const job = await createJob(data);
  res.status(201).json({ ok: true, job });
});

app.put("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
  const data = jobFromBody(req.body);
  if (!data.title) {
    return res.status(400).json({ ok: false, error: "Titel ist erforderlich." });
  }
  const job = await updateJob(req.params.id, data);
  if (!job) return res.status(404).json({ ok: false, error: "Stelle nicht gefunden." });
  res.json({ ok: true, job });
});

app.delete("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
  await deleteJob(req.params.id);
  res.json({ ok: true });
});

// ---------- Admin-API: Eingänge ----------
app.get("/api/admin/submissions", requireAdmin, async (_req, res) => {
  const submissions = await listSubmissions();
  res.json({ ok: true, submissions });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Admin-Seite (statische Dateien danach als Fallback)
app.get("/admin", (_req, res) => res.sendFile(join(__dirname, "public", "admin.html")));

app.use(express.static(join(__dirname, "public")));

async function start() {
  await initStore();
  app.listen(PORT, () => {
    console.log(`Kaderplus läuft auf http://localhost:${PORT}`);
    console.log(`Speicher: ${storageBackend === "postgres" ? "Postgres (DATABASE_URL)" : "lokale JSON-Dateien (data/)"}`);
    console.log(
      emailConfigured
        ? "E-Mail-Versand: aktiv (SMTP konfiguriert)"
        : "E-Mail-Versand: inaktiv – Eingänge werden nur gespeichert. SMTP_* setzen zum Aktivieren."
    );
    if (!adminEnabled) {
      console.log("Admin: DEAKTIVIERT – ADMIN_PASSWORD setzen, um /admin zu nutzen.");
    } else if (adminUsesDevDefault) {
      console.log('Admin: aktiv mit DEV-Standardpasswort "admin" – für Produktion ADMIN_PASSWORD setzen!');
    } else {
      console.log("Admin: aktiv (ADMIN_PASSWORD gesetzt).");
    }
  });
}

start();
