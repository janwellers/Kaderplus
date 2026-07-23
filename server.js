import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { appendFile, mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DATA_DIR = join(__dirname, "data");

const app = express();
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use(express.static(join(__dirname, "public")));

const isEmail = (v) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v, max = 2000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

async function saveSubmission(type, payload) {
  await mkdir(DATA_DIR, { recursive: true });
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  await appendFile(join(DATA_DIR, "submissions.json"), JSON.stringify(record) + "\n");
  return record;
}

// Bewerbung (applicants)
app.post("/api/apply", async (req, res) => {
  const name = clean(req.body.name, 120);
  const email = clean(req.body.email, 160);
  const role = clean(req.body.role, 120);
  const message = clean(req.body.message, 2000);

  if (!name || !isEmail(email) || !role) {
    return res.status(400).json({
      ok: false,
      error: "Bitte Name, gültige E-Mail und gewünschte Position angeben.",
    });
  }

  await saveSubmission("application", { name, email, role, message });
  return res.status(201).json({
    ok: true,
    message: "Danke! Deine Bewerbung ist eingegangen – wir melden uns.",
  });
});

// Bedarf melden (clubs)
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

  await saveSubmission("club_request", { club, contact, email, position, message });
  return res.status(201).json({
    ok: true,
    message: "Danke! Ihre Anfrage ist eingegangen – wir melden uns innerhalb von 24 Stunden.",
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Kaderplus läuft auf http://localhost:${PORT}`);
});
