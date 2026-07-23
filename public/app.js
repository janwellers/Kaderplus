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
  btn.addEventListener("click", () => openModal(btn.dataset.openModal));
});

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
