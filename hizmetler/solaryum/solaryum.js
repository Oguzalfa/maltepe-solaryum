const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

document.documentElement.classList.add("sol-ready");

const menuBtn = document.querySelector(".sol-menu-btn");
const nav = document.querySelector(".sol-nav");
const menuLabel = document.querySelector("[data-sol-menu-label]");

function setMenu(open, { restore = true } = {}) {
  if (!menuBtn || !nav) return;
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  nav.classList.toggle("is-open", open);
  if (menuLabel) menuLabel.textContent = open ? "Menüyü Kapat" : "Menüyü Aç";
  menuBtn.setAttribute("aria-label", open ? "Menüyü Kapat" : "Menüyü Aç");
  if (open) nav.querySelector("a")?.focus();
  else if (restore) menuBtn.focus();
}

menuBtn?.addEventListener("click", () => {
  setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
});

nav?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false, { restore: false });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuBtn?.getAttribute("aria-expanded") === "true" && !document.querySelector("#sc-booking-dialog[open]")) {
    setMenu(false);
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-booking-trigger]")) setMenu(false, { restore: false });
});

const gallery = document.querySelector("[data-sol-gallery]");
const frame = gallery?.querySelector("[data-sol-frame]");
const switcher = gallery?.querySelector(".sol-switch");
const live = gallery?.querySelector("[data-sol-live]");
const errorBox = gallery?.querySelector("[data-sol-error]");
const fallback = gallery?.querySelector("[data-sol-fallback]");
let current = "genel";

function showFallback() {
  if (fallback) fallback.hidden = false;
}

function selectView(id, { announce = false } = {}) {
  current = id;
  gallery?.querySelectorAll("[data-sol-view]").forEach((node) => {
    node.hidden = node.dataset.solView !== id;
  });
  switcher?.querySelectorAll("[data-sol-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.solChoice === id ? "true" : "false");
  });
  if (errorBox) errorBox.hidden = true;
  frame?.classList.toggle("is-detail", id === "detay");
  if (announce && live) live.textContent = id === "detay" ? "Işık detayı seçildi." : "Genel görünüm seçildi.";
}

if (switcher) switcher.hidden = false;

switcher?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sol-choice]");
  if (!button || button.getAttribute("aria-pressed") === "true") return;
  selectView(button.dataset.solChoice, { announce: true });
});

switcher?.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  const next = event.key === "ArrowRight" ? "detay" : "genel";
  selectView(next, { announce: true });
  switcher.querySelector(`[data-sol-choice="${next}"]`)?.focus();
});

gallery?.querySelector("[data-sol-reset]")?.addEventListener("click", () => {
  selectView("genel", { announce: true });
  switcher?.querySelector('[data-sol-choice="genel"]')?.focus();
});

gallery?.querySelectorAll("[data-sol-view] img, [data-sol-view]").forEach((node) => {
  const image = node.tagName === "IMG" ? node : node.querySelector("img");
  image?.addEventListener("error", () => {
    if (node.dataset.solView === "genel" || image.closest("[data-sol-view='genel']")) showFallback();
    if ((node.dataset.solView || image.closest("[data-sol-view]")?.dataset.solView) === "detay") {
      if (errorBox) errorBox.hidden = false;
      selectView("genel", { announce: true });
    }
  });
});

let swipe = null;
frame?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (event.pointerType === "mouse") return;
  swipe = { x: event.clientX, y: event.clientY };
});
frame?.addEventListener("pointerup", (event) => {
  if (!swipe) return;
  const dx = event.clientX - swipe.x;
  const dy = event.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
  selectView(dx < 0 ? "detay" : "genel", { announce: true });
});
frame?.addEventListener("pointercancel", () => {
  swipe = null;
});

function bindTilt() {
  if (!frame || reduceMotion.matches || !finePointer.matches) {
    if (frame) frame.style.transform = "";
    return;
  }
  frame.addEventListener("pointermove", onTilt);
  frame.addEventListener("pointerleave", clearTilt);
}
function unbindTilt() {
  frame?.removeEventListener("pointermove", onTilt);
  frame?.removeEventListener("pointerleave", clearTilt);
  if (frame) frame.style.transform = "";
}
function onTilt(event) {
  if (event.pointerType !== "mouse") return;
  const rect = frame.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width - 0.5;
  const py = (event.clientY - rect.top) / rect.height - 0.5;
  frame.style.transform = `perspective(900px) rotateY(${(px * 2.2).toFixed(2)}deg) rotateX(${(-py * 1.6).toFixed(2)}deg)`;
}
function clearTilt() {
  if (frame) frame.style.transform = "";
}
if (!reduceMotion.matches && finePointer.matches) bindTilt();
reduceMotion.addEventListener("change", () => {
  unbindTilt();
  if (!reduceMotion.matches && finePointer.matches) bindTilt();
});

const waHref = "https://wa.me/905356276563?text=" + encodeURIComponent("Merhaba, Maltepe Solaryum için randevu bilgisi almak istiyorum.");

function tuneDialog(dialog) {
  if (dialog.dataset.solTuned) return;
  dialog.dataset.solTuned = "1";
  const title = dialog.querySelector("#sc-booking-title");
  if (title) title.textContent = "Randevu talebi";
  const intro = dialog.querySelector("#sc-booking-intro");
  if (intro) intro.textContent = "Uygun gün ve saati WhatsApp’tan paylaşın.";
  const close = dialog.querySelector("[data-booking-close]");
  if (close) close.setAttribute("aria-label", "Randevu penceresini kapat");
  const eyebrow = dialog.querySelector(".sc-booking-eyebrow");
  if (eyebrow) eyebrow.hidden = true;
  const actions = document.createElement("div");
  actions.className = "sol-sheet-actions";
  const wa = document.createElement("a");
  wa.className = "sol-sheet-wa";
  wa.href = waHref;
  wa.target = "_blank";
  wa.rel = "noopener noreferrer";
  wa.textContent = "WhatsApp’a geç";
  const call = document.createElement("a");
  call.className = "sol-sheet-call";
  call.href = "tel:+905356276563";
  call.textContent = "Stüdyoyu ara";
  actions.append(wa, call);
  (intro || dialog.querySelector(".sc-booking-header"))?.insertAdjacentElement("afterend", actions);
}

function watchDialog() {
  const ready = document.getElementById("sc-booking-dialog");
  if (ready) tuneDialog(ready);
  const observer = new MutationObserver(() => {
    const dialog = document.getElementById("sc-booking-dialog");
    if (dialog) tuneDialog(dialog);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
watchDialog();
