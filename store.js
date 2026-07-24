// Persistenzschicht für Stellen (jobs) und Formulareingänge (submissions).
// Nutzt Postgres, wenn DATABASE_URL gesetzt ist – sonst lokale JSON-Dateien (Dev).
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const JOBS_FILE = join(DATA_DIR, "jobs.json");
const SUBS_FILE = join(DATA_DIR, "submissions.json");

const usePg = Boolean(process.env.DATABASE_URL);
export const storageBackend = usePg ? "postgres" : "file";

let pool = null;

function newId() {
  return randomUUID();
}

function mapJobRow(r) {
  return {
    id: r.id,
    title: r.title,
    category: r.category || "",
    club: r.club || "",
    location: r.location || "",
    employmentType: r.employment_type || "",
    description: r.description || "",
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  };
}

// ---------- Postgres ----------
async function initPg() {
  const { default: pg } = await import("pg");
  const ssl = process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false };
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      club TEXT,
      location TEXT,
      employment_type TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      job_id TEXT,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

// ---------- File (Dev) ----------
async function readJson(file, fallback) {
  try {
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

// ---------- Öffentliche API ----------
export async function initStore() {
  if (usePg) {
    await initPg();
  } else {
    await mkdir(DATA_DIR, { recursive: true });
  }
}

export async function listJobs({ includeClosed = false } = {}) {
  if (usePg) {
    const { rows } = includeClosed
      ? await pool.query("SELECT * FROM jobs ORDER BY created_at DESC")
      : await pool.query("SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC");
    return rows.map(mapJobRow);
  }
  const jobs = await readJson(JOBS_FILE, []);
  const sorted = [...jobs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return includeClosed ? sorted : sorted.filter((j) => j.status === "open");
}

export async function getJob(id) {
  if (usePg) {
    const { rows } = await pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
    return rows[0] ? mapJobRow(rows[0]) : null;
  }
  const jobs = await readJson(JOBS_FILE, []);
  return jobs.find((j) => j.id === id) || null;
}

export async function createJob(data) {
  const id = newId();
  if (usePg) {
    const { rows } = await pool.query(
      `INSERT INTO jobs (id, title, category, club, location, employment_type, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, data.title, data.category, data.club, data.location, data.employmentType, data.description, data.status || "open"]
    );
    return mapJobRow(rows[0]);
  }
  const jobs = await readJson(JOBS_FILE, []);
  const now = new Date().toISOString();
  const job = {
    id,
    title: data.title,
    category: data.category || "",
    club: data.club || "",
    location: data.location || "",
    employmentType: data.employmentType || "",
    description: data.description || "",
    status: data.status || "open",
    createdAt: now,
    updatedAt: now,
  };
  jobs.push(job);
  await writeJson(JOBS_FILE, jobs);
  return job;
}

export async function updateJob(id, data) {
  if (usePg) {
    const { rows } = await pool.query(
      `UPDATE jobs SET title=$2, category=$3, club=$4, location=$5, employment_type=$6,
         description=$7, status=$8, updated_at=now() WHERE id=$1 RETURNING *`,
      [id, data.title, data.category, data.club, data.location, data.employmentType, data.description, data.status]
    );
    return rows[0] ? mapJobRow(rows[0]) : null;
  }
  const jobs = await readJson(JOBS_FILE, []);
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  jobs[idx] = {
    ...jobs[idx],
    title: data.title,
    category: data.category || "",
    club: data.club || "",
    location: data.location || "",
    employmentType: data.employmentType || "",
    description: data.description || "",
    status: data.status,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(JOBS_FILE, jobs);
  return jobs[idx];
}

export async function deleteJob(id) {
  if (usePg) {
    await pool.query("DELETE FROM jobs WHERE id = $1", [id]);
    return;
  }
  const jobs = await readJson(JOBS_FILE, []);
  await writeJson(JOBS_FILE, jobs.filter((j) => j.id !== id));
}

export async function createSubmission({ type, jobId = null, data }) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  if (usePg) {
    await pool.query(
      "INSERT INTO submissions (id, type, job_id, data, created_at) VALUES ($1,$2,$3,$4,$5)",
      [id, type, jobId, JSON.stringify(data), createdAt]
    );
    return { id, type, jobId, createdAt, ...data };
  }
  const subs = await readJson(SUBS_FILE, []);
  const record = { id, type, jobId, createdAt, ...data };
  subs.push(record);
  await writeJson(SUBS_FILE, subs);
  return record;
}

export async function listSubmissions() {
  if (usePg) {
    const { rows } = await pool.query("SELECT * FROM submissions ORDER BY created_at DESC");
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      jobId: r.job_id,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      ...r.data,
    }));
  }
  const subs = await readJson(SUBS_FILE, []);
  return [...subs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
