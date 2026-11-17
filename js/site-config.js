import {
  buildWhatsAppUrl,
  resolveServiceHref,
} from "./scroll-progress.mjs";

let cached = null;

export async function loadSiteContent() {
  if (cached) return cached;
  const res = await fetch(new URL("../config/site-content.json", import.meta.url), { cache: "no-cache" });
  if (!res.ok) throw new Error("site-content.json yüklenemedi");
  cached = await res.json();
  return cached;
}

export function getWhatsAppLink(content) {
  const phone = content?.whatsapp?.phoneInternationalDigits ?? content?.contact?.phoneInternationalDigits ?? null;
  const message = content?.whatsapp?.message ?? "";
  return buildWhatsAppUrl(phone, message);
}

export function mapSearchUrl(query) {
  const text = String(query || "").trim();
  if (!text) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

export function mapDirectionsUrl(addressLines, postalCode) {
  if (!Array.isArray(addressLines)) return null;
  const lines = addressLines.filter(Boolean);
  if (lines.length < 2) return null;
  const district = [postalCode, lines.at(-1)].filter(Boolean).join(" ");
  const destination = [...lines.slice(0, -1), district].join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function setLines(el, lines) {
  el.replaceChildren();
  lines.forEach((line, index) => {
    if (index) el.append(document.createElement("br"));
    el.append(document.createTextNode(line));
  });
}

export function applyContact(root, content) {
  const contact = content?.contact || {};
  const digits = String(content?.whatsapp?.phoneInternationalDigits || contact.phoneInternationalDigits || "");
  const tel = contact.phoneTel && String(contact.phoneTel).startsWith("tel:+") ? contact.phoneTel : digits ? `tel:+${digits}` : "";
  const lines = Array.isArray(contact.addressLines) ? contact.addressLines.filter(Boolean) : [];
  const searchUrl = mapSearchUrl(contact.mapQuery || lines.join(" "));
  const directionsUrl = mapDirectionsUrl(lines, contact.postalCode);
  const instagram = typeof contact.instagram === "string" && contact.instagram.startsWith("https://") ? contact.instagram : "";

  root.querySelectorAll("[data-contact='address']").forEach((el) => {
    const part = el.dataset.contactPart;
    if (lines.length && !el.hasAttribute("data-contact-keep")) {
      if (part === "city") el.textContent = lines[lines.length - 1] || "";
      else if (part === "street") setLines(el, lines.slice(0, -1));
      else if (el.dataset.contactFormat === "line") el.textContent = lines.join(" ");
      else setLines(el, lines);
    }
    const canLink = el.tagName === "A" || el.hasAttribute("href");
    if (!canLink) return;
    const mapUrl = el.dataset.contactMap === "directions" ? directionsUrl : searchUrl;
    if (mapUrl) {
      el.setAttribute("href", mapUrl);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    } else {
      el.removeAttribute("href");
    }
  });

  root.querySelectorAll("[data-contact='phone']").forEach((el) => {
    const slot = el.querySelector("[data-contact-value]");
    if (contact.phoneLabel) {
      if (slot) slot.textContent = contact.phoneLabel;
      else if (!el.hasAttribute("data-contact-keep")) el.textContent = contact.phoneLabel;
    }
    if (tel) el.setAttribute("href", tel);
    else el.removeAttribute("href");
  });

  root.querySelectorAll("[data-contact='instagram']").forEach((el) => {
    const slot = el.querySelector("[data-contact-value]");
    if (contact.instagramLabel) {
      if (slot) slot.textContent = contact.instagramLabel;
      else if (!el.hasAttribute("data-contact-keep")) el.textContent = contact.instagramLabel;
    }
    if (instagram) {
      el.setAttribute("href", instagram);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    } else {
      el.removeAttribute("href");
    }
  });
}

export function mapServices(content) {
  return (content?.services || []).map((service) => {
    const resolved = resolveServiceHref(service);
    return { ...service, ...resolved };
  });
}

export function applyCtaLinks(root, whatsappUrl) {
  // Never surface config/dev help copy to sighted users (report-only).
  root.querySelectorAll("[data-cta-help]").forEach((n) => {
    n.hidden = true;
    n.setAttribute("aria-hidden", "true");
  });

  const nodes = root.querySelectorAll("[data-cta='whatsapp']");
  nodes.forEach((node) => {
    if (whatsappUrl) {
      node.setAttribute("href", whatsappUrl);
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
      node.removeAttribute("role");
      node.removeAttribute("aria-disabled");
      node.removeAttribute("aria-describedby");
      node.classList.remove("is-disabled");
    } else {
      node.setAttribute("role", "link");
      node.setAttribute("aria-disabled", "true");
      node.removeAttribute("href");
      node.removeAttribute("aria-describedby");
      node.classList.add("is-disabled");
      node.addEventListener("click", (e) => e.preventDefault());
    }
  });
}

// Per-link service routes stay on the configured specialist origin.
export function serviceLinkHref(href, path) {
  if (!href || !path || !/^\/[a-z0-9-]+\/$/.test(path)) return href;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") return href;
    return new URL(path, url).href;
  } catch {
    return href;
  }
}

export function applyServiceLinks(root, services) {
  services.forEach((service) => {
    const nodes = root.querySelectorAll("[data-service='" + service.id + "']");
    nodes.forEach((el) => {
      const labels = el.querySelectorAll("[data-service-link-label]");
      if (service.available && service.href) {
        el.setAttribute("href", serviceLinkHref(service.href, el.dataset.servicePath));
        if (service.navigation === "external") {
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        } else {
          el.removeAttribute("target");
          el.removeAttribute("rel");
        }
        el.classList.remove("is-disabled");
        el.removeAttribute("aria-disabled");
        labels.forEach((label) => {
          if (label.dataset.availableLabel) label.textContent = label.dataset.availableLabel;
        });
      } else if (service.navigation === "external") {
        el.removeAttribute("href");
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("aria-label", service.title || "Hizmet");
        el.classList.add("is-disabled");
        // Keep design CTA wording; never show unavailable/dev labels to users
        labels.forEach((label) => {
          if (label.dataset.availableLabel) label.textContent = label.dataset.availableLabel;
        });
        el.addEventListener("click", (e) => e.preventDefault());
      }
    });
  });
}

