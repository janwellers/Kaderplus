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

Eingesendete Formulare werden zeilenweise als JSON in `data/submissions.json` gespeichert
(diese Datei ist per `.gitignore` ausgenommen und wird zur Laufzeit angelegt).

> Hinweis: E-Mail-Versand / Weiterleitung an einen Posteingang ist noch nicht angebunden.
> Für den Produktivbetrieb kann hier z. B. ein SMTP-Versand (nodemailer) oder ein
> Formular-Dienst (Formspree, Web3Forms) ergänzt werden.

## Struktur

```
public/
  index.html   Landingpage + Formular-Modals
  styles.css   Design (Taktiktafel-Look, gold/pitch)
  app.js       Modal-Steuerung + Formular-Absenden (fetch)
server.js      Express: statische Auslieferung + API-Endpunkte
data/          Laufzeit-Speicher der Formulareingänge
```
