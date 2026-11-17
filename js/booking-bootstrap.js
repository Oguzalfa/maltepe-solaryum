import { loadSiteContent } from './site-config.js?v=booking1';
import { initBooking } from './booking.js?v=solaryum2';

// If config or dialog support is unavailable, the page links still work.
loadSiteContent().then(content => initBooking({
  root: document,
  content,
  focusFallback: () => {
    const menuButton = document.querySelector('.sol-menu-btn');
    return menuButton?.getClientRects().length ? menuButton : document.querySelector('.sol-header .sol-brand');
  },
})).catch(() => {});
