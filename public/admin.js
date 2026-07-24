// Admin-Oberfläche für Kaderplus: Login + Stellenverwaltung + Eingänge.

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
    if (target === "subs") loadSubmissions();
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
  `;
  return el;
}

checkSession();
