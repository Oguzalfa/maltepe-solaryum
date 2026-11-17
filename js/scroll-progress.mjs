/** Pure scroll → pose helpers (unit-tested). */

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function progressFromScroll(scrollY, start, end) {
  const span = end - start;
  if (!(span > 0)) return 0;
  return clamp01((scrollY - start) / span);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Deterministic scene pose from shared progress p ∈ [0,1].
 * Same p always returns the same pose (forward/back scroll).
 */
export function poseFromProgress(p, profile = "desktop") {
  const progress = clamp01(p);
  const mobile = profile === "mobile";

  // Tight crossfades — avoid long muddy double-exposure windows
  const lashIn = smoothstep(0.15, 0.26, progress);
  const lashOut = smoothstep(0.36, 0.46, progress);
  const nailIn = smoothstep(0.38, 0.48, progress);
  const nailOut = smoothstep(0.62, 0.72, progress);
  const photoOpacity = {
    portrait: 1 - lashIn,
    lash: lashIn * (1 - lashOut),
    nail: nailIn * (1 - nailOut),
  };

  const polishReveal = smoothstep(0.64, 0.76, progress);
  const polishSettle = smoothstep(0.94, 1, progress);

  const camera = mobile
    ? {
        x: lerp(0.15, 0.35, polishReveal),
        y: lerp(0.2, 0.05, polishReveal),
        z: lerp(4.8, 3.2, polishReveal - polishSettle * 0.15),
        rotY: lerp(-0.08, 0.32, polishReveal),
        rotX: lerp(0.06, -0.04, polishReveal),
      }
    : {
        x: lerp(0.55, 0.2, polishReveal),
        y: lerp(0.15, 0.05, polishReveal),
        z: lerp(5.2, 3.4, polishReveal - polishSettle * 0.12),
        rotY: lerp(-0.12, 0.38, polishReveal),
        rotX: lerp(0.04, -0.06, polishReveal),
      };

  const object = {
    rotY: lerp(0.15, -0.28, polishReveal),
    rotX: lerp(0.02, 0.08, polishReveal),
    y: lerp(-0.15, 0, polishReveal),
  };

  const copy = copyForProgress(progress);

  return {
    progress,
    photoOpacity,
    polishOpacity: polishReveal,
    canvasActive: polishReveal > 0.02,
    camera,
    object,
    copy,
    beat: beatForProgress(progress),
  };
}

export function beatForProgress(p) {
  const progress = clamp01(p);
  if (progress < 0.16) return "portrait";
  if (progress < 0.36) return "lash";
  if (progress < 0.44) return "lash-to-nail";
  if (progress < 0.63) return "nail";
  if (progress < 0.75) return "nail-to-polish";
  if (progress < 0.94) return "polish-3d";
  return "exit";
}

export function copyForProgress(p) {
  const progress = clamp01(p);
  if (progress < 0.16) {
    return {
      id: "portrait",
      linesDesktop: ["Güzellik,", "sizin imzanız."],
      linesMobile: ["Güzellik,", "sizin imzanız."],
      sub: "İpek kirpik. Protez tırnak. Size özel dokunuşlar.",
      mobileSub: "İpek kirpik. Protez tırnak. Size özel dokunuşlar.",
    };
  }
  if (progress < 0.36) {
    return {
      id: "lash",
      linesDesktop: ["Bakışınıza", "özel."],
      linesMobile: ["Bakışınıza", "özel."],
      sub: "İpek kirpik",
      mobileSub: "İpek kirpik",
    };
  }
  if (progress < 0.44) {
    return {
      id: "transition",
      linesDesktop: [],
      linesMobile: [],
      sub: "",
      mobileSub: "",
    };
  }
  if (progress < 0.63) {
    return {
      id: "nail",
      linesDesktop: ["Tarzınız,", "parmak uçlarınızda."],
      linesMobile: ["Tarzınız,", "parmak", "uçlarınızda."],
      sub: "Protez tırnak",
      mobileSub: "Protez tırnak",
    };
  }
  if (progress < 0.75) {
    return {
      id: "transition",
      linesDesktop: [],
      linesMobile: [],
      sub: "",
      mobileSub: "",
    };
  }
  return {
    id: "signature",
    linesDesktop: ["Kalitenin", "imzası."],
    linesMobile: ["Kalitenin", "imzası."],
    sub: "Güzellik ve bakımda her detaya özen.",
    mobileSub: "Güzellik ve bakımda her detaya özen.",
    experienceLabel: "YILLIK TECRÜBE",
  };
}

export function buildWhatsAppUrl(phoneDigits, message) {
  if (!phoneDigits || !/^\d{10,15}$/.test(String(phoneDigits))) {
    return null;
  }
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${phoneDigits}?text=${text}`;
}

export function resolveServiceHref(service) {
  if (!service) return { href: null, available: false, reason: "missing" };
  if (service.navigation === "internal") {
    const anchor = service.anchor || service.proposedAnchor;
    if (!anchor || typeof anchor !== "string" || !anchor.startsWith("#")) {
      return { href: null, available: false, reason: "missing-anchor" };
    }
    return { href: anchor, available: true, reason: null };
  }
  if (service.navigation === "external") {
    const url = service.url;
    if (!url || typeof url !== "string") {
      return { href: null, available: false, reason: "missing-url" };
    }
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { href: null, available: false, reason: "invalid-url" };
      }
      return { href: parsed.href, available: true, reason: null };
    } catch {
      return { href: null, available: false, reason: "invalid-url" };
    }
  }
  return { href: null, available: false, reason: "unknown-nav" };
}
