// Redaktionell pflegbare Texte der Website.
// Jedes Feld hat einen Standardtext (identisch mit dem Markup in public/) und
// kann im Admin-Bereich überschrieben werden. Ein leerer Wert setzt zurück.

export const contentGroups = [
  {
    id: "hero",
    label: "Startbereich",
    fields: [
      { key: "hero.kicker", label: "Kleine Zeile oben", default: "Personalvermittlung · Fußball · Funktionsteam" },
      {
        key: "hero.title",
        label: "Große Überschrift",
        default: "Das Team *hinter* dem Team.",
        hint: "Ein Wort in *Sternchen* wird kursiv hervorgehoben.",
      },
      {
        key: "hero.text",
        label: "Einleitungstext",
        type: "textarea",
        default:
          "Kaderplus vermittelt sportliches Funktionspersonal: Athletiktrainer, Videoanalysten, Physiotherapeuten und Scouts — für Nachwuchsleistungszentren und Vereine, die sich professionalisieren.",
      },
      { key: "hero.ctaPrimary", label: "Button 1", default: "Offene Position melden" },
      { key: "hero.ctaSecondary", label: "Button 2", default: "Als Kandidat:in bewerben" },
      {
        key: "board.caption",
        label: "Bildunterschrift Taktiktafel",
        type: "textarea",
        default: "Elf Spieler gewinnen kein Spiel allein. Wir besetzen die Positionen an der Seitenlinie.",
      },
    ],
  },
  {
    id: "nav",
    label: "Navigation & Fußzeile",
    fields: [
      { key: "nav.jobs", label: "Menüpunkt Stellen", default: "Offene Stellen" },
      { key: "nav.cta", label: "Button oben rechts", default: "Position melden" },
      {
        key: "footer.text",
        label: "Fußzeile",
        default: "© 2026 Kaderplus · Vermittlung von sportlichem Funktionspersonal",
      },
    ],
  },
  {
    id: "positions",
    label: "Abschnitt „Diese Positionen besetzen wir“",
    fields: [
      { key: "positions.kicker", label: "Kleine Zeile", default: "Aufstellung" },
      { key: "positions.heading", label: "Überschrift", default: "Diese Positionen besetzen wir" },
      {
        key: "positions.sub",
        label: "Untertitel",
        type: "textarea",
        default:
          "Vom sportlichen Kernteam bis in Verwaltung, Vertrieb und Medien — wir vermitteln alle Funktionsstellen im Verein außerhalb von Spielern und Trainern.",
      },
      { key: "positions.item1.badge", label: "1 · Kürzel", default: "AT" },
      { key: "positions.item1.title", label: "1 · Titel", default: "Athletiktrainer" },
      {
        key: "positions.item1.text",
        label: "1 · Text",
        type: "textarea",
        default:
          "Kraft-, Schnelligkeits- und Präventionstraining — vom NLZ bis zur ersten Mannschaft. Sportwissenschaftlich ausgebildet, mit Fußball-Fokus.",
      },
      { key: "positions.item2.badge", label: "2 · Kürzel", default: "VA" },
      { key: "positions.item2.title", label: "2 · Titel", default: "Videoanalyst" },
      {
        key: "positions.item2.text",
        label: "2 · Text",
        type: "textarea",
        default:
          "Spiel- und Gegneranalyse, Datenaufbereitung fürs Trainerteam. Zertifizierte Analysten, die moderne Tools beherrschen.",
      },
      { key: "positions.item3.badge", label: "3 · Kürzel", default: "PH" },
      { key: "positions.item3.title", label: "3 · Titel", default: "Physiotherapeut & Reha-Trainer" },
      {
        key: "positions.item3.text",
        label: "3 · Text",
        type: "textarea",
        default:
          "Behandlung, Belastungssteuerung und Return-to-Play — Physios mit Erfahrung im Mannschaftssport statt Praxisalltag.",
      },
      { key: "positions.item4.badge", label: "4 · Kürzel", default: "SC" },
      { key: "positions.item4.title", label: "4 · Titel", default: "Scout & NLZ-Personal" },
      {
        key: "positions.item4.text",
        label: "4 · Text",
        type: "textarea",
        default:
          "Spielersichtung, Datenscouting und Koordination im Nachwuchsbereich — Profile, die Ihre NLZ-Zertifizierung absichern.",
      },
    ],
  },
  {
    id: "jobs",
    label: "Abschnitt Stellenbörse",
    fields: [
      { key: "jobs.kicker", label: "Kleine Zeile", default: "Stellenbörse" },
      { key: "jobs.heading", label: "Überschrift", default: "Aktuell offene Stellen" },
      {
        key: "jobs.sub",
        label: "Untertitel",
        type: "textarea",
        default:
          "Konkrete Vakanzen aus unserem Netzwerk. Bewirb dich direkt auf eine Stelle — oder weiter unten allgemein für unseren Kandidatenpool.",
      },
      {
        key: "jobs.empty",
        label: "Text, wenn keine Stelle offen ist",
        type: "textarea",
        default:
          "Aktuell sind keine Stellen ausgeschrieben. Bewirb dich gern allgemein für unseren Kandidatenpool.",
      },
      { key: "jobs.applyButton", label: "Button auf einer Stellenkarte", default: "Auf diese Stelle bewerben" },
    ],
  },
  {
    id: "audience",
    label: "Abschnitt „Für wen wir arbeiten“",
    fields: [
      { key: "audience.kicker", label: "Kleine Zeile", default: "Zielgruppen" },
      { key: "audience.heading", label: "Überschrift", default: "Für wen wir arbeiten" },
      { key: "audience.item1.label", label: "1 · Label", default: "NLZ" },
      {
        key: "audience.item1.text",
        label: "1 · Text",
        type: "textarea",
        default: "Nachwuchsleistungszentren, die Zertifizierungsauflagen mit qualifiziertem Personal erfüllen müssen.",
      },
      { key: "audience.item2.label", label: "2 · Label", default: "2. + 3. Liga" },
      {
        key: "audience.item2.text",
        label: "2 · Text",
        type: "textarea",
        default: "Profivereine, die ihr Funktionsteam vergrößern, ohne eine eigene HR-Abteilung zu haben.",
      },
      { key: "audience.item3.label", label: "3 · Label", default: "Regionalliga" },
      {
        key: "audience.item3.text",
        label: "3 · Text",
        type: "textarea",
        default: "Ambitionierte Clubs, die sich professionalisieren und den nächsten Schritt gehen wollen.",
      },
      { key: "audience.item4.label", label: "4 · Label", default: "Frauen-Bundesliga" },
      {
        key: "audience.item4.text",
        label: "4 · Text",
        type: "textarea",
        default: "Der am schnellsten wachsende Bereich im deutschen Fußball — mit entsprechendem Personalbedarf.",
      },
    ],
  },
  {
    id: "process",
    label: "Abschnitt „So läuft die Besetzung“",
    fields: [
      { key: "process.kicker", label: "Kleine Zeile", default: "Spielplan" },
      { key: "process.heading", label: "Überschrift", default: "So läuft die Besetzung" },
      { key: "process.step1.title", label: "Schritt 1 · Titel", default: "Anstoß" },
      {
        key: "process.step1.text",
        label: "Schritt 1 · Text",
        type: "textarea",
        default: "Sie melden uns die offene Position. Im Erstgespräch klären wir Anforderungsprofil, Budget und Zeitrahmen.",
      },
      { key: "process.step2.title", label: "Schritt 2 · Titel", default: "Aufstellung" },
      {
        key: "process.step2.text",
        label: "Schritt 2 · Text",
        type: "textarea",
        default:
          "Wir stellen Ihnen passende, vorgeprüfte Kandidatenprofile aus unserem Pool vor — in der Regel innerhalb von zwei Wochen.",
      },
      { key: "process.step3.title", label: "Schritt 3 · Titel", default: "Einwechslung" },
      {
        key: "process.step3.text",
        label: "Schritt 3 · Text",
        type: "textarea",
        default:
          "Sie führen die Gespräche, wir begleiten bis zur Vertragsunterschrift und bleiben auch danach Ansprechpartner.",
      },
      { key: "process.fairplay.title", label: "Hinweisbox · Titel", default: "Fairplay-Prinzip:" },
      {
        key: "process.fairplay.text",
        label: "Hinweisbox · Text",
        type: "textarea",
        default:
          "Ein Honorar entsteht ausschließlich bei erfolgreicher Besetzung. Kein Vorschuss, keine laufenden Kosten, kein Risiko.",
      },
    ],
  },
  {
    id: "about",
    label: "Abschnitt „Wer hinter Kaderplus steht“",
    fields: [
      { key: "about.kicker", label: "Kleine Zeile", default: "Trainerbank" },
      { key: "about.heading", label: "Überschrift", default: "Wer hinter Kaderplus steht" },
      {
        key: "about.text1",
        label: "Absatz 1",
        type: "textarea",
        default:
          "*Jan [Nachname]* verbindet zwei Welten: hauptberufliche Erfahrung in der professionellen Personaldisposition — Akquise, Matching, Koordination — und ein Sportmanagement-Studium an der IU.",
        hint: "Text in *Sternchen* wird hervorgehoben.",
      },
      {
        key: "about.text2",
        label: "Absatz 2",
        type: "textarea",
        default:
          "Kaderplus entstand aus einer einfachen Beobachtung: Vereine professionalisieren ihren sportlichen Bereich schneller, als sie Personal dafür finden. Genau diese Lücke schließen wir — mit dem Handwerk der Personaldienstleistung und dem Netzwerk aus dem Sport.",
      },
    ],
  },
  {
    id: "contact",
    label: "Abschnitt Kontakt",
    fields: [
      { key: "contact.heading", label: "Überschrift", default: "Bereit für den nächsten Schritt?" },
      {
        key: "contact.text",
        label: "Text",
        type: "textarea",
        default:
          "Melden Sie eine offene Position oder bewerben Sie sich für unseren Kandidatenpool — Antwort innerhalb von 24 Stunden.",
      },
      { key: "contact.ctaPrimary", label: "Button 1", default: "Offene Position melden" },
      { key: "contact.ctaSecondary", label: "Button 2", default: "Als Kandidat:in bewerben" },
      { key: "contact.subPrefix", label: "Zusatzzeile · Anfang", default: "Lieber direkt?" },
      { key: "contact.email", label: "Kontakt-E-Mail", default: "jan@kaderplus.de" },
      { key: "contact.linkedinLabel", label: "LinkedIn · Linktext", default: "LinkedIn" },
      { key: "contact.linkedinUrl", label: "LinkedIn · Adresse", default: "https://www.linkedin.com/company/kaderplus" },
    ],
  },
  {
    id: "forms",
    label: "Formulare (Fenster)",
    fields: [
      { key: "request.kicker", label: "Vereine · Kleine Zeile", default: "Für Vereine" },
      { key: "request.title", label: "Vereine · Überschrift", default: "Offene Position melden" },
      {
        key: "request.intro",
        label: "Vereine · Einleitung",
        type: "textarea",
        default: "Sagen Sie uns, welche Position Sie besetzen möchten. Wir melden uns innerhalb von 24 Stunden.",
      },
      { key: "apply.kicker", label: "Kandidat:innen · Kleine Zeile", default: "Für Kandidat:innen" },
      { key: "apply.title", label: "Kandidat:innen · Überschrift", default: "In den Pool bewerben" },
      {
        key: "apply.intro",
        label: "Kandidat:innen · Einleitung",
        type: "textarea",
        default: "Werden Sie Teil unseres Kandidatenpools. Passende Vereine kommen zu uns — wir bringen Sie zusammen.",
      },
      { key: "applyJob.title", label: "Bewerbung auf Stelle · Überschrift", default: "Auf diese Stelle bewerben" },
      {
        key: "applyJob.intro",
        label: "Bewerbung auf Stelle · Einleitung",
        type: "textarea",
        default: "Bewirb dich direkt auf die ausgewählte Stelle. Wir melden uns zeitnah zurück.",
      },
    ],
  },
  {
    id: "meta",
    label: "Suchmaschinen & Browser-Titel",
    fields: [
      { key: "meta.title", label: "Seitentitel", default: "Kaderplus — Das Team hinter dem Team" },
      {
        key: "meta.description",
        label: "Beschreibung (Google-Snippet)",
        type: "textarea",
        default:
          "Kaderplus vermittelt sportliches Funktionspersonal im Fußball: Athletiktrainer, Videoanalysten, Physiotherapeuten und Scouts für NLZs und Vereine.",
      },
    ],
  },
  {
    id: "impressum",
    label: "Impressum (Pflichtangaben)",
    note: "Diese Felder erscheinen 1:1 im Impressum. Erst ausfüllen, wenn das Unternehmen angemeldet ist.",
    fields: [
      { key: "impressum.name", label: "Vollständiger Name / Firma", default: "[Vollständiger Name]" },
      { key: "impressum.street", label: "Straße und Hausnummer", default: "[Straße und Hausnummer]" },
      { key: "impressum.city", label: "PLZ und Ort", default: "[PLZ Ort]" },
      { key: "impressum.email", label: "E-Mail", default: "[E-Mail-Adresse]" },
      { key: "impressum.phone", label: "Telefon", default: "[Telefonnummer, optional]" },
      {
        key: "impressum.vat",
        label: "Umsatzsteuer-IdNr.",
        default: "[USt-IdNr., falls vorhanden — sonst diesen Abschnitt entfernen]",
      },
    ],
  },
];

export const contentFields = contentGroups.flatMap((g) => g.fields);

export const contentDefaults = Object.fromEntries(contentFields.map((f) => [f.key, f.default]));

export const isContentKey = (key) => Object.prototype.hasOwnProperty.call(contentDefaults, key);

export function mergeContent(overrides) {
  const merged = { ...contentDefaults };
  for (const [key, value] of Object.entries(overrides || {})) {
    if (isContentKey(key) && value) merged[key] = value;
  }
  return merged;
}
