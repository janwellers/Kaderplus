# Kaderplus

Landingpage für **Kaderplus** – Personalvermittlung für sportliches Funktionspersonal im Fußball
(Athletiktrainer, Videoanalysten, Physiotherapeuten, Scouts / NLZ-Personal).

Die Seite kombiniert eine Marketing-Landingpage mit zwei funktionierenden Formularen:

- **Offene Position melden** – für Vereine mit Personalbedarf (`POST /api/request`)
- **In den Pool bewerben** – für Kandidat:innen (`POST /api/apply`)

## Tech

- Statisches Frontend (`public/`): HTML, CSS, Vanilla JS – kein Build-Schritt nötig
- Leichter [Express](https://expressjs.com/)-Server (`server.js`), der die Seite ausliefert und Formulareingänge entgegennimmt

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

Ist SMTP konfiguriert, verschickt der Server zusätzlich:

- eine **Benachrichtigung** an `NOTIFY_EMAIL` (Standard `jan@kaderplus.de`) und
- eine **Eingangsbestätigung** an die Absender-Adresse.

Konfiguration über Umgebungsvariablen (siehe `.env.example` → nach `.env` kopieren):

```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
NOTIFY_EMAIL=jan@kaderplus.de
```

Ohne SMTP-Konfiguration läuft die Seite normal weiter – Eingänge landen dann nur in
`data/submissions.json`, es werden keine Mails verschickt.

## Deployment (Render + Domain bei Strato)

Die App ist ein Node-/Express-Server und braucht einen Node-Host (kein reines
Statik-/PHP-Webhosting). Empfohlen: [Render](https://render.com) (Gratis-Tier),
Domain-DNS bei Strato.

1. Render-Account anlegen (Login mit GitHub) und **New → Blueprint** wählen; das
   Repo verbinden. Render liest `render.yaml` und legt den Web-Service an.
2. SMTP-Werte im Render-Dashboard unter *Environment* eintragen (`SMTP_HOST`,
   `SMTP_USER`, `SMTP_PASS`) – nicht ins Repo committen.
3. Nach dem Deploy ist die Seite unter `https://<name>.onrender.com` erreichbar.
4. Eigene Domain: in Render *Settings → Custom Domains* die Domain hinzufügen und
   die angezeigten DNS-Einträge (CNAME für `www`, ALIAS/A für die Root-Domain) bei
   Strato im DNS-Verwaltungsbereich eintragen. SSL stellt Render automatisch aus.

> Hinweis: `data/submissions.json` ist auf Render **flüchtig** (wird bei jedem
> Deploy zurückgesetzt). Für zuverlässigen Eingang SMTP aktivieren oder später eine
> Datenbank/externe Persistenz anbinden.

## Struktur

```
public/
  index.html   Landingpage + Formular-Modals
  styles.css   Design (Taktiktafel-Look, gold/pitch)
  app.js       Modal-Steuerung + Formular-Absenden (fetch)
server.js      Express: statische Auslieferung + API-Endpunkte
mailer.js      Optionaler SMTP-Versand (Benachrichtigung + Bestätigung)
env.js         Lädt .env (falls vorhanden)
data/          Laufzeit-Speicher der Formulareingänge
```
