// Admin-Oberfläche für Kaderplus: Login, Stellenverwaltung, Eingänge und
// die redaktionell pflegbaren Texte der Website.

const AREAS = [
  "Sportliche Leitung & Kaderplanung",
  "Scouting & Analyse",
  "Nachwuchsleistungszentrum (NLZ)",
  "Medizin, Physio & Athletik",
  "Ausrüstung & Spielbetrieb",
  "Kaufmännisch & Verwaltung",
  "Vertrieb, Sponsoring & Marketing",
  "Medien & Kommunikation",
  "Organisation, Fans & IT",
  "Andere",
];

const EMPLOYMENT_TYPES = [
  "Vollzeit",
  "Teilzeit",
  "Werkstudent",
  "Praktikum",
  "Ehrenamt",
  "Minijob",
  "Honorar / Freelance",
];

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso || "";
  }
}

function $(id) {
  return document.getElementById(id);
}

// ---------- Views ----------
const loginView = $("login-view");
const dashView = $("dash-view");
const logoutBtn = $("logout-btn");

function showLogin() {
  loginView.hidden = false;
  dashView.hidden = true;
  logoutBtn.hidden = true;
}

function showDashboard() {
  loginView.hidden = true;
  dashView.hidden = false;
  logoutBtn.hidden = false;
  loadJobs();
}

async function checkSession() {
  try {
    const res = await fetch("/api/admin/session");
    const data = await res.json();
    if (data.authenticated) showDashboard();
    else showLogin();
  } catch {
    showLogin();
  }
}

// ---------- Login ----------
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("login-status");
  status.textContent = "";
  status.className = "form-status";
  const password = $("login-password").value;
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      $("login-password").value = "";
      showDashboard();
    } else {
      status.textContent = data.error || "Anmeldung fehlgeschlagen.";
      status.classList.add("error");
    }
  } catch {
    status.textContent = "Verbindung fehlgeschlagen.";
    status.classList.add("error");
  }
});

logoutBtn.addEventListener("click", async () => {
  await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
  showLogin();
});

// ---------- Tabs ----------
document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    $("tab-jobs").hidden = target !== "jobs";
    $("tab-subs").hidden = target !== "subs";
    $("tab-content").hidden = target !== "content";
    if (target === "subs") loadSubmissions();
    if (target === "content") loadContent();
  });
});

// ---------- Job-Editor ----------
const editor = $("job-editor");
const jobForm = $("job-form");

function fillSelect(sel, values, placeholder) {
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}
fillSelect($("job-category"), AREAS, "— Bereich wählen —");
fillSelect($("job-employmentType"), EMPLOYMENT_TYPES, "— wählen —");

function openEditor(job) {
  $("job-status-msg").textContent = "";
  $("job-status-msg").className = "form-status";
  $("job-editor-title").textContent = job ? "Stelle bearbeiten" : "Neue Stelle";
  $("job-id").value = job ? job.id : "";
  $("job-title").value = job ? job.title : "";
  $("job-category").value = job ? job.category || "" : "";
  $("job-club").value = job ? job.club || "" : "";
  $("job-location").value = job ? job.location || "" : "";
  $("job-employmentType").value = job ? job.employmentType || "" : "";
  $("job-description").value = job ? job.description || "" : "";
  $("job-status").value = job ? job.status : "open";
  editor.hidden = false;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
  $("job-title").focus();
}

$("new-job-btn").addEventListener("click", () => openEditor(null));
$("job-cancel").addEventListener("click", () => { editor.hidden = true; });

jobForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("job-status-msg");
  status.textContent = "";
  status.className = "form-status";
  if (!jobForm.checkValidity()) {
    status.textContent = "Bitte einen Titel eingeben.";
    status.classList.add("error");
    jobForm.reportValidity();
    return;
  }
  const id = $("job-id").value;
  const payload = {
    title: $("job-title").value,
    category: $("job-category").value,
    club: $("job-club").value,
    location: $("job-location").value,
    employmentType: $("job-employmentType").value,
    description: $("job-description").value,
    status: $("job-status").value,
  };
  try {
    const res = await fetch(id ? `/api/admin/jobs/${id}` : "/api/admin/jobs", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      editor.hidden = true;
      loadJobs();
    } else if (res.status === 401) {
      showLogin();
    } else {
      status.textContent = data.error || "Speichern fehlgeschlagen.";
      status.classList.add("error");
    }
  } catch {
    status.textContent = "Verbindung fehlgeschlagen.";
    status.classList.add("error");
  }
});

// ---------- Stellenliste ----------
async function loadJobs() {
  const list = $("jobs-admin-list");
  list.innerHTML = '<p class="admin-hint">Wird geladen …</p>';
  try {
    const res = await fetch("/api/admin/jobs");
    if (res.status === 401) return showLogin();
    const data = await res.json();
    const jobs = data.jobs || [];
    if (!jobs.length) {
      list.innerHTML = '<p class="admin-hint">Noch keine Stellen angelegt. Lege oben deine erste Stelle an.</p>';
      return;
    }
    list.innerHTML = "";
    jobs.forEach((job) => list.appendChild(jobAdminCard(job)));
  } catch {
    list.innerHTML = '<p class="admin-hint">Konnte Stellen nicht laden.</p>';
  }
}

function jobAdminCard(job) {
  const meta = [job.club, job.location, job.employmentType, job.category].filter(Boolean);
  const el = document.createElement("div");
  el.className = "job-admin";
  el.innerHTML = `
    <div class="job-admin-head">
      <div>
        <h4>${esc(job.title)}</h4>
        ${meta.length ? `<p class="job-meta">${meta.map(esc).join(" · ")}</p>` : ""}
      </div>
      <span class="tag ${job.status === "open" ? "open" : "closed"}">${job.status === "open" ? "Offen" : "Geschlossen"}</span>
    </div>
    <div class="job-admin-actions">
      <button class="btn-sm" data-act="edit">Bearbeiten</button>
      <button class="btn-sm" data-act="toggle">${job.status === "open" ? "Schließen" : "Wieder öffnen"}</button>
      <button class="btn-sm danger" data-act="delete">Löschen</button>
    </div>
  `;
  el.querySelector('[data-act="edit"]').addEventListener("click", () => openEditor(job));
  el.querySelector('[data-act="toggle"]').addEventListener("click", () => toggleJob(job));
  el.querySelector('[data-act="delete"]').addEventListener("click", () => deleteJob(job));
  return el;
}

async function toggleJob(job) {
  const payload = { ...job, status: job.status === "open" ? "closed" : "open" };
  const res = await fetch(`/api/admin/jobs/${job.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) return showLogin();
  loadJobs();
}

async function deleteJob(job) {
  if (!confirm(`Stelle „${job.title}" wirklich löschen?`)) return;
  const res = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
  if (res.status === 401) return showLogin();
  loadJobs();
}

// ---------- Eingänge ----------
$("refresh-subs").addEventListener("click", loadSubmissions);

async function loadSubmissions() {
  const list = $("subs-list");
  list.innerHTML = '<p class="admin-hint">Wird geladen …</p>';
  try {
    const res = await fetch("/api/admin/submissions");
    if (res.status === 401) return showLogin();
    const data = await res.json();
    const subs = data.submissions || [];
    if (!subs.length) {
      list.innerHTML = '<p class="admin-hint">Noch keine Eingänge.</p>';
      return;
    }
    list.innerHTML = "";
    subs.forEach((s) => list.appendChild(subCard(s)));
  } catch {
    list.innerHTML = '<p class="admin-hint">Konnte Eingänge nicht laden.</p>';
  }
}

async function deleteSubmission(s, el) {
  if (!confirm("Diesen Eingang wirklich löschen?")) return;
  const res = await fetch(`/api/admin/submissions/${encodeURIComponent(s.id)}`, { method: "DELETE" });
  if (res.status === 401) return showLogin();
  el.remove();
  if (!$("subs-list").children.length) {
    $("subs-list").innerHTML = '<p class="admin-hint">Noch keine Eingänge.</p>';
  }
}

function subCard(s) {
  const el = document.createElement("div");
  el.className = "sub-item";
  const isApp = s.type === "application";
  const label = isApp ? "Bewerbung" : "Vereinsanfrage";
  const rows = isApp
    ? [
        ["Name", s.name],
        ["E-Mail", s.email],
        ["Position", s.role],
        ["Stelle", s.jobTitle],
        ["Kurzprofil", s.message],
      ]
    : [
        ["Verein", s.club],
        ["Ansprechpartner", s.contact],
        ["E-Mail", s.email],
        ["Position", s.position],
        ["Details", s.message],
      ];
  el.innerHTML = `
    <span class="mono">${label} · ${esc(fmtDate(s.createdAt))}</span>
    <dl>
      ${rows.filter(([, v]) => v).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}
    </dl>
    <div class="job-admin-actions">
      <button class="btn-sm danger" data-act="delete">Löschen</button>
    </div>
  `;
  el.querySelector('[data-act="delete"]').addEventListener("click", () => deleteSubmission(s, el));
  return el;
}

// ---------- Texte der Website ----------
let contentFields = [];

function fieldId(key) {
  return `cms-${key.replace(/\./g, "-")}`;
}

function contentField(field, value) {
  const id = fieldId(field.key);
  const wrap = document.createElement("div");
  wrap.className = "field";
  const isLong = field.type === "textarea";
  wrap.innerHTML = `
    <label for="${id}">${esc(field.label)}</label>
    ${isLong
      ? `<textarea id="${id}" rows="3"></textarea>`
      : `<input id="${id}" type="text">`}
    <p class="admin-hint cms-hint">
      ${field.hint ? `${esc(field.hint)} ` : ""}<button class="link-btn" type="button" data-act="reset">Standardtext einsetzen</button>
    </p>
  `;
  const input = wrap.querySelector(isLong ? "textarea" : "input");
  input.value = value;
  wrap.querySelector('[data-act="reset"]').addEventListener("click", () => {
    input.value = field.default;
    input.focus();
  });
  return wrap;
}

async function loadContent() {
  const box = $("content-groups");
  box.innerHTML = '<p class="admin-hint">Wird geladen …</p>';
  try {
    const res = await fetch("/api/admin/content");
    if (res.status === 401) return showLogin();
    const data = await res.json();
    const groups = data.groups || [];
    const content = data.content || {};
    contentFields = groups.flatMap((g) => g.fields);
    box.innerHTML = "";
    groups.forEach((group) => {
      const card = document.createElement("div");
      card.className = "admin-card cms-group";
      card.innerHTML = `
        <h3>${esc(group.label)}</h3>
        ${group.note ? `<p class="admin-hint">${esc(group.note)}</p>` : ""}
      `;
      group.fields.forEach((field) => card.appendChild(contentField(field, content[field.key] ?? "")));
      box.appendChild(card);
    });
  } catch {
    box.innerHTML = '<p class="admin-hint">Konnte Texte nicht laden.</p>';
  }
}

async function saveContent() {
  const status = $("content-status");
  status.textContent = "Wird gespeichert …";
  status.className = "form-status";
  const payload = {};
  contentFields.forEach((field) => {
    const el = $(fieldId(field.key));
    if (el) payload[field.key] = el.value;
  });
  try {
    const res = await fetch("/api/admin/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: payload }),
    });
    if (res.status === 401) return showLogin();
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      contentFields.forEach((field) => {
        const el = $(fieldId(field.key));
        if (el) el.value = data.content[field.key] ?? "";
      });
      status.textContent = "Gespeichert – die Website zeigt die neuen Texte.";
      status.classList.add("success");
    } else {
      status.textContent = data.error || "Speichern fehlgeschlagen.";
      status.classList.add("error");
    }
  } catch {
    status.textContent = "Verbindung fehlgeschlagen.";
    status.classList.add("error");
  }
}

$("content-save").addEventListener("click", saveContent);
$("content-save-bottom").addEventListener("click", saveContent);

checkSession();
