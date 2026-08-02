// Überschreibt die im Markup hinterlegten Standardtexte mit den im Admin
// gepflegten Inhalten. Bleibt die Anfrage aus, zeigt die Seite den Standard.
(function () {
  function esc(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // *Wort* wird hervorgehoben, Zeilenumbrüche bleiben erhalten.
  function rich(value) {
    return esc(value)
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br>");
  }

  function safeUrl(value) {
    return /^(https?:|mailto:|\/)/i.test(value) ? value : "#";
  }

  const isPlaceholder = (value) => /^\s*\[.*\]\s*$/.test(value);

  function apply(content) {
    document.querySelectorAll("[data-cms]").forEach((el) => {
      const key = el.dataset.cms;
      if (!(key in content)) return;
      const value = content[key];
      el.innerHTML = rich(value);
      if ("cmsMail" in el.dataset) el.setAttribute("href", safeUrl(`mailto:${value}`));
      // Gepflegte Rechtsangaben sind keine Platzhalter mehr.
      if (!isPlaceholder(value)) el.classList.remove("placeholder");
    });

    // Hinweis auf offene Platzhalter nur zeigen, solange es welche gibt.
    const note = document.querySelector("[data-placeholder-note]");
    if (note) {
      const open = Array.from(document.querySelectorAll(".legal .placeholder"))
        .filter((el) => !note.contains(el));
      note.hidden = open.length === 0;
    }

    document.querySelectorAll("[data-cms-href]").forEach((el) => {
      const key = el.dataset.cmsHref;
      if (key in content) el.setAttribute("href", safeUrl(content[key]));
    });

    if (content["meta.title"]) document.title = content["meta.title"];
    const desc = document.querySelector('meta[name="description"]');
    if (desc && content["meta.description"]) desc.setAttribute("content", content["meta.description"]);
  }

  window.kpContent = null;
  window.kpContentReady = fetch("/api/content")
    .then((res) => res.json())
    .then((data) => {
      const content = (data && data.content) || {};
      window.kpContent = content;
      apply(content);
      document.dispatchEvent(new CustomEvent("kp:content", { detail: content }));
      return content;
    })
    .catch(() => null);
})();
