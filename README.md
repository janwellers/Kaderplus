# Kaderplus

Landingpage für **Kaderplus** – Personalvermittlung für sportliches Funktionspersonal im Fußball
(Athletiktrainer, Videoanalysten, Physiotherapeuten, Scouts / NLZ-Personal).

Die Seite kombiniert eine Marketing-Landingpage mit einer **Stellenbörse** und drei
Funktionen:

- **Offene Position melden** – für Vereine mit Personalbedarf (`POST /api/request`)
- **In den Pool bewerben** / **Auf eine Stelle bewerben** – für Kandidat:innen (`POST /api/apply`)
- **Stellenbörse** – öffentlich ausgeschriebene Stellen (`GET /api/jobs`), gepflegt über den Admin-Bereich

## Stellenbörse & Admin

- Öffentliche Stellenliste auf der Startseite (Abschnitt „Offene Stellen"); pro Stelle
  kann direkt eine Bewerbung abgegeben werden.
- Passwortgeschützter Admin-Bereich unter **`/admin`** zum **Anlegen, Bearbeiten,
  Schließen und Löschen** von Stellen sowie zum Einsehen aller Eingänge.
- Zugang über `ADMIN_PASSWORD` (siehe unten). Ohne gesetztes Passwort ist der Admin
  in Produktion deaktiviert; lokal gilt das Dev-Passwort `admin`.

## Tech

- Statisches Frontend (`public/`): HTML, CSS, Vanilla JS – kein Build-Schritt nötig
- Leichter [Express](https://expressjs.com/)-Server (`server.js`), der die Seite ausliefert, die Stellenbörse/Admin-API bereitstellt und Formulareingänge entgegennimmt
- Persistenz über **Postgres** (`DATABASE_URL`) – ohne DB Fallback auf lokale JSON-Dateien unter `data/` (nur für Entwicklung)

## Lokal starten

```bash
npm install
npm start
# http://localhost:3000
```

Für Entwicklung mit Auto-Reload: `npm run dev`.

## Formulareingänge

Eingesendete Formulare werden immer zeilenweise als JSON in `data/submissions.json`
gespeichert (diese Datei ist per `.gitignore` ausgenommen und wird zur Laufzeit angelegt).

### E-Mail-Versand (optional)

Ist der Mailversand konfiguriert, verschickt der Server zusätzlich:

- eine **Benachrichtigung** an `NOTIFY_EMAIL` (Standard `jan@kaderplus.de`) und
- eine **Eingangsbestätigung** an die Absender-Adresse.

Es gibt zwei Wege (siehe `.env.example` → nach `.env` kopieren):

**Resend (empfohlen, HTTPS)** – nötig auf Hostern, die ausgehende SMTP-Ports sperren
(Render Free-Tier blockt 25/465/587). Domain in Resend verifizieren, Key erzeugen:

```
RESEND_API_KEY=re_...
MAIL_FROM=Kaderplus <info@kaderplus.de>   # Adresse der verifizierten Domain
NOTIFY_EMAIL=j.wellers@kaderplus.de
```

**SMTP (Fallback)** – wird nur genutzt, wenn `RESEND_API_KEY` leer ist:

```
SMTP_HOST=smtp.strato.de
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
NOTIFY_EMAIL=jan@kaderplus.de
```

Ohne beides läuft die Seite normal weiter – Eingänge werden weiterhin gespeichert und
sind unter `/admin` sichtbar, es werden nur keine Mails verschickt. Der Versand läuft
immer im Hintergrund und verzögert die Formularantwort nicht.

## Deployment (Render + Domain bei Strato)

Die App ist ein Node-/Express-Server und braucht einen Node-Host (kein reines
Statik-/PHP-Webhosting). Empfohlen: [Render](https://render.com) (Gratis-Tier),
Domain-DNS bei Strato.

1. **Datenbank anlegen** (kostenlos): bei [Neon](https://neon.tech) oder
   [Supabase](https://supabase.com) eine Postgres-DB erstellen und den
   Connection-String (`postgresql://…`) kopieren.
2. Render-Account anlegen (Login mit GitHub) und **New → Blueprint** wählen; das
   Repo verbinden. Render liest `render.yaml` und legt den Web-Service an.
3. Im Render-Dashboard unter *Environment* eintragen (nicht ins Repo committen):
   - `DATABASE_URL` – der Connection-String aus Schritt 1
   - `ADMIN_PASSWORD` – dein Wunsch-Passwort für `/admin`
   - optional Mailversand: `RESEND_API_KEY` (empfohlen) oder `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`
4. Nach dem Deploy ist die Seite unter `https://<name>.onrender.com` erreichbar,
   der Admin unter `https://<name>.onrender.com/admin`.
5. Eigene Domain: in Render *Settings → Custom Domains* die Domain hinzufügen und
   die angezeigten DNS-Einträge (CNAME für `www`, ALIAS/A für die Root-Domain) bei
   Strato im DNS-Verwaltungsbereich eintragen. SSL stellt Render automatisch aus.

> Hinweis: Ohne `DATABASE_URL` speichert die App in lokale JSON-Dateien, die auf
> Render **flüchtig** sind (werden bei jedem Deploy zurückgesetzt). Für dauerhaft
> gespeicherte Stellen und Eingänge daher unbedingt eine Postgres-DB anbinden.

## Struktur

```
public/
  index.html   Landingpage + Stellenbörse + Formular-Modals
  styles.css   Design (Taktiktafel-Look, gold/pitch)
  app.js       Modal-Steuerung, Formular-Absenden, Stellenbörse (fetch)
  admin.html   Admin-Oberfläche (Login + Stellenverwaltung)
  admin.js     Admin-Logik (Login, CRUD für Stellen, Eingänge)
server.js      Express: Auslieferung + öffentliche & Admin-API-Endpunkte
store.js       Persistenz (Postgres via DATABASE_URL, sonst JSON-Dateien)
auth.js        Passwort-Login für /admin (signiertes Cookie)
mailer.js      Optionaler Mailversand via Resend-API oder SMTP (Benachrichtigung + Bestätigung)
env.js         Lädt .env (falls vorhanden)
data/          Laufzeit-Speicher (nur ohne DATABASE_URL)
```

## Admin-API (Auszug)

| Methode | Pfad | Zweck |
| --- | --- | --- |
| `GET` | `/api/jobs` | Öffentliche Liste offener Stellen |
| `POST` | `/api/admin/login` | Login (`{ password }`) |
| `GET` | `/api/admin/jobs` | Alle Stellen (inkl. geschlossene) |
| `POST` | `/api/admin/jobs` | Stelle anlegen |
| `PUT` | `/api/admin/jobs/:id` | Stelle bearbeiten / öffnen / schließen |
| `DELETE` | `/api/admin/jobs/:id` | Stelle löschen |
| `GET` | `/api/admin/submissions` | Eingegangene Bewerbungen/Anfragen |
