// Einfache Passwort-Authentifizierung für die Admin-Seite via signiertem Cookie.
import crypto from "node:crypto";

const isProd = process.env.NODE_ENV === "production";
// Ohne gesetztes ADMIN_PASSWORD: im Dev-Betrieb Fallback "admin", in Produktion deaktiviert.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProd ? "" : "admin");
const SECRET =
  process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "kaderplus-dev-secret";

const COOKIE = "kp_admin";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const adminEnabled = Boolean(ADMIN_PASSWORD);
export const adminUsesDevDefault = !process.env.ADMIN_PASSWORD && !isProd;

function sign(value) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function makeToken() {
  const exp = String(Date.now() + MAX_AGE_MS);
  return `${exp}.${sign(exp)}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return false;
  const [exp, sig] = token.split(".");
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, sign(exp));
}

export function checkPassword(pw) {
  if (!ADMIN_PASSWORD) return false;
  return safeEqual(pw, ADMIN_PASSWORD);
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function isAuthed(req) {
  return verifyToken(parseCookies(req)[COOKIE]);
}

export function setAuthCookie(res) {
  res.cookie(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: MAX_AGE_MS,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE, { path: "/" });
}

export function requireAdmin(req, res, next) {
  if (isAuthed(req)) return next();
  return res.status(401).json({ ok: false, error: "Nicht autorisiert." });
}
