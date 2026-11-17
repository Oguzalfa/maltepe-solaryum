const menuButton = document.querySelector(".sol-menu-btn");
const nav = document.querySelector(".sol-nav");
const menuLabel = menuButton?.querySelector("[data-sol-menu-label]");
const desktop = window.matchMedia("(min-width: 960px)");

function setMenu(open, restoreFocus = false) {
  if (!menuButton || !nav) return;
  menuButton.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
  if (menuLabel) menuLabel.textContent = open ? "Menüyü Kapat" : "Menüyü Aç";
  if (restoreFocus) menuButton.focus();
}

menuButton?.addEventListener("click", () => {
  setMenu(menuButton.getAttribute("aria-expanded") !== "true");
});
nav?.addEventListener("click", (event) => {
  if (!desktop.matches && event.target.closest("a")) setMenu(false, true);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true" &&
      !document.querySelector("#sc-booking-dialog[open]")) {
    setMenu(false, true);
  }
});
desktop.addEventListener("change", () => setMenu(false));

const gallery = document.querySelector("[data-sol-gallery]");

if (gallery) {
  const frame = gallery.querySelector("[data-sol-frame]");
  const switcher = gallery.querySelector(".sol-switch");
  const live = gallery.querySelector("[data-sol-live]");
  const error = gallery.querySelector("[data-sol-error]");
  const fallback = gallery.querySelector("[data-sol-fallback]");
  const views = [...gallery.querySelectorAll("[data-sol-view]")];
  const buttons = [...switcher.querySelectorAll("[data-sol-choice]")];
  const failed = new Set();
  let current = "genel";
  let swipe;

  function selectView(requested, announce = false) {
    const detailUnavailable = requested === "detay" && failed.has("detay");
    current = detailUnavailable ? "genel" : requested;
    views.forEach((view) => { view.hidden = view.dataset.solView !== current || failed.has(current); });
    buttons.forEach((button) => { button.setAttribute("aria-pressed", String(button.dataset.solChoice === current)); });
    frame.classList.toggle("is-detail", current === "detay");
    fallback.hidden = !failed.has(current);
    error.hidden = !detailUnavailable;

    if (announce) {
      live.textContent = detailUnavailable ? "Işık detayı yüklenemedi." :
        current === "detay" ? "Işık detayı seçildi." : "Genel görünüm seçildi.";
    }
  }

  views.forEach((view) => {
    const img = view.matches("img") ? view : view.querySelector("img");
    const id = view.dataset.solView;
    const onError = () => {
      failed.add(id);
      if (current === id) selectView(id, true);
    };

    img.addEventListener("load", () => {
      if (failed.delete(id) && current === id) selectView(id);
    });
    img.addEventListener("error", onError);
    if (img.complete && !img.naturalWidth) onError();
  });

  switcher.hidden = false;
  switcher.addEventListener("click", (event) => {
    const button = event.target.closest("[data-sol-choice]");
    if (button) selectView(button.dataset.solChoice, true);
  });
  switcher.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = event.key === "ArrowRight" ? "detay" : "genel";
    selectView(next, true);
    buttons.find((button) => button.dataset.solChoice === current)?.focus();
  });

  frame.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" || !event.isPrimary) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    frame.setPointerCapture(event.pointerId);
  });
  frame.addEventListener("pointerup", (event) => {
    if (swipe?.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x;
    const dy = event.clientY - swipe.y;
    swipe = undefined;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      selectView(dx < 0 ? "detay" : "genel", true);
    }
  });
  frame.addEventListener("lostpointercapture", () => { swipe = undefined; });

  const motion = window.matchMedia("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)");
  function resetDepth() {
    frame.style.removeProperty("--sol-shift-x");
    frame.style.removeProperty("--sol-shift-y");
  }
  frame.addEventListener("pointermove", (event) => {
    if (!motion.matches || event.pointerType !== "mouse") return;
    const rect = frame.getBoundingClientRect();
    frame.style.setProperty("--sol-shift-x", `${((event.clientX - rect.left) / rect.width - .5) * 8}px`);
    frame.style.setProperty("--sol-shift-y", `${((event.clientY - rect.top) / rect.height - .5) * 6}px`);
  });
  frame.addEventListener("pointerleave", resetDepth);
  motion.addEventListener("change", resetDepth);
}

document.documentElement.classList.add("sol-ready");
