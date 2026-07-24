// Scroll-Reveal
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ---------- Modal-Handling ----------
let lastFocused = null;

function openModal(name) {
  const modal = document.getElementById(`modal-${name}`);
  if (!modal) return;
  lastFocused = document.activeElement;
  modal.hidden = false;
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
  const firstField = modal.querySelector("input, select, textarea");
  if (firstField) firstField.focus();
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("open");
  modal.hidden = true;
  document.body.style.overflow = "";
  if (lastFocused) lastFocused.focus();
}

document.querySelectorAll("[data-open-modal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.openModal === "apply") clearJobContext();
    openModal(btn.dataset.openModal);
  });
});

// ---------- Bewerbung auf eine konkrete Stelle ----------
const applyTitleEl = document.getElementById("apply-title");
const applyIntroEl = document.querySelector("#modal-apply .modal-intro");
const applyJobField = document.getElementById("apply-job-field");
const applyRoleField = document.getElementById("apply-role-field");
const appJobTitle = document.getElementById("app-job-title");
const appJobId = document.getElementById("app-jobid");
const appRole = document.getElementById("app-role");
const DEFAULT_APPLY_TITLE = applyTitleEl ? applyTitleEl.textContent : "";
const DEFAULT_APPLY_INTRO = applyIntroEl ? applyIntroEl.textContent : "";

function clearJobContext() {
  const form = document.getElementById("form-apply");
  if (form) form.reset();
  if (appJobId) appJobId.value = "";
  if (appJobTitle) appJobTitle.value = "";
  if (applyJobField) applyJobField.hidden = true;
  if (applyRoleField) applyRoleField.hidden = false;
  if (appRole) appRole.setAttribute("required", "");
  if (applyTitleEl) applyTitleEl.textContent = DEFAULT_APPLY_TITLE;
  if (applyIntroEl) applyIntroEl.textContent = DEFAULT_APPLY_INTRO;
}

function openJobApply(job) {
  const form = document.getElementById("form-apply");
  if (form) form.reset();
  const statusEl = document.getElementById("apply-status");
  if (statusEl) {
    statusEl.textContent = "";
    statusEl.className = "form-status";
  }
  if (appJobId) appJobId.value = job.id;
  if (appJobTitle) appJobTitle.value = job.club ? `${job.title} · ${job.club}` : job.title;
  if (applyJobField) applyJobField.hidden = false;
  // Rolle ist durch die Stelle vorgegeben – Auswahlfeld ausblenden.
  if (applyRoleField) applyRoleField.hidden = true;
  if (appRole) appRole.removeAttribute("required");
  if (applyTitleEl) applyTitleEl.textContent = "Auf diese Stelle bewerben";
  if (applyIntroEl) applyIntroEl.textContent = "Bewirb dich direkt auf die ausgewählte Stelle. Wir melden uns zeitnah zurück.";
  openModal("apply");
}

document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
  modal.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(modal));
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const open = document.querySelector(".modal.open");
    if (open) closeModal(open);
  }
});

// ---------- Formular-Absenden ----------
function wireForm(formId, endpoint, statusId) {
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    if (!form.checkValidity()) {
      status.textContent = "Bitte alle Pflichtfelder (*) korrekt ausfüllen.";
      status.classList.add("error");
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Wird gesendet …";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        status.textContent = data.message || "Danke! Ihre Nachricht ist eingegangen.";
        status.classList.add("success");
        form.reset();
      } else {
        status.textContent = data.error || "Etwas ist schiefgelaufen. Bitte später erneut versuchen.";
        status.classList.add("error");
      }
    } catch {
      status.textContent = "Verbindung fehlgeschlagen. Bitte Internetverbindung prüfen.";
      status.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

wireForm("form-request", "/api/request", "request-status");
wireForm("form-apply", "/api/apply", "apply-status");

// ---------- Stellenbörse laden & rendern ----------
function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function jobCard(job) {
  const meta = [job.club, job.location, job.employmentType].filter(Boolean);
  const card = document.createElement("article");
  card.className = "job";
  card.innerHTML = `
    ${job.category ? `<span class="job-cat mono">${esc(job.category)}</span>` : ""}
    <h3>${esc(job.title)}</h3>
    ${meta.length ? `<p class="job-meta">${meta.map(esc).join(" · ")}</p>` : ""}
    ${job.description ? `<p class="job-desc">${esc(job.description)}</p>` : ""}
    <button class="btn btn-gold job-apply" type="button">Auf diese Stelle bewerben</button>
  `;
  card.querySelector(".job-apply").addEventListener("click", () => openJobApply(job));
  return card;
}

async function loadJobs() {
  const list = document.getElementById("jobs-list");
  if (!list) return;
  try {
    const res = await fetch("/api/jobs");
    const data = await res.json();
    const jobs = (data && data.jobs) || [];
    list.innerHTML = "";
    if (!jobs.length) {
      list.innerHTML =
        '<p class="jobs-empty">Aktuell sind keine Stellen ausgeschrieben. Bewirb dich gern allgemein für unseren Kandidatenpool.</p>';
      return;
    }
    jobs.forEach((job) => list.appendChild(jobCard(job)));
  } catch {
    list.innerHTML =
      '<p class="jobs-empty">Stellen konnten nicht geladen werden. Bitte später erneut versuchen.</p>';
  }
}

loadJobs();
