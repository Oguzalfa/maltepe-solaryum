import { loadSiteContent } from './site-config.js?v=booking1';
import { initBooking } from './booking.js?v=mobile-audit1';

// Standalone reading/service pages keep their WhatsApp hrefs if config fails.
loadSiteContent().then(content => initBooking({
  root: document, content, focusFallback: () => document.querySelector('.site-header .brand'),
})).catch(() => {});
