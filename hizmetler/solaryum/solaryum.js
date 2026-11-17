const menuButton = document.querySelector(".sol-menu-btn");
const nav = document.querySelector(".sol-nav");
const header = menuButton?.closest(".sol-header");
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
document.addEventListener("click", (event) => {
  if (menuButton?.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true" &&
      !document.querySelector("#sc-booking-dialog[open]")) {
    setMenu(false, true);
  }
});
desktop.addEventListener("change", () => setMenu(false));

document.documentElement.classList.add("sol-ready");

const hero = document.querySelector("[data-sol-scene]");

if (hero) {
  const scene = hero.querySelector(".sol-hero-scene");
  const detail = hero.querySelector(".sol-frame-detail");
  const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
  let frameId = 0;
  let previousBlend;

  function updateScene() {
    frameId = 0;
    if (!hero.classList.contains("is-cinematic")) return;

    const distance = hero.clientHeight - scene.offsetHeight;
    const stickyTop = Number.parseFloat(getComputedStyle(scene).top) || 0;
    const position = distance > 0 ? (stickyTop - hero.getBoundingClientRect().top) / distance : 0;
    const phase = Math.max(0, Math.min(1, (position - .12) / .74));
    const blend = (phase * phase * (3 - 2 * phase)).toFixed(3);

    if (blend !== previousBlend) {
      hero.style.setProperty("--scene-blend", blend);
      previousBlend = blend;
    }
  }

  function requestSceneUpdate() {
    if (!frameId) frameId = window.requestAnimationFrame(updateScene);
  }

  function syncMotion() {
    hero.classList.toggle("is-cinematic", motion.matches && detail.naturalWidth > 0);
    requestSceneUpdate();
  }

  window.addEventListener("scroll", requestSceneUpdate, { passive: true });
  window.addEventListener("resize", requestSceneUpdate, { passive: true });
  window.addEventListener("pageshow", requestSceneUpdate);
  motion.addEventListener("change", syncMotion);
  detail.addEventListener("load", syncMotion);
  detail.addEventListener("error", syncMotion);
  syncMotion();
}
