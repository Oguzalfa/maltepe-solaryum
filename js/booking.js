import { createBookingDraft, DEFAULT_BOOKING_SERVICES, normaliseRecipient, validateBookingFields } from './booking-message.mjs';

const instances = new WeakMap();

export function initBooking({ root = document, content, onBeforeOpen = () => {}, focusFallback = null, serviceOptions = DEFAULT_BOOKING_SERVICES } = {}) {
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const win = doc?.defaultView;
  if (!doc?.body || !win || typeof win.HTMLDialogElement?.prototype.showModal !== 'function') return { dispose() {} };
  if (instances.has(doc)) return instances.get(doc);
  let number;
  try { number = normaliseRecipient(content?.whatsapp?.phoneInternationalDigits || content?.contact?.phoneInternationalDigits); }
  catch { return { dispose() {} }; }
  const options = [...new Set(serviceOptions.map((value) => String(value).trim()).filter(Boolean))];
  if (!options.length) return { dispose() {} };
  const brand = [content?.brand?.name, content?.brand?.descriptor].filter(Boolean).join(' ').trim();
  const infoUrl = new URL(`https://wa.me/${number}`);
  infoUrl.searchParams.set('text', 'Merhaba, Maltepe Solaryum için randevu bilgisi almak istiyorum.');
  const dialog = doc.createElement('dialog');
  dialog.id = 'sc-booking-dialog';
  dialog.className = 'sc-booking-dialog';
  dialog.setAttribute('aria-labelledby', 'sc-booking-title');
  dialog.setAttribute('aria-describedby', 'sc-booking-intro');
  dialog.innerHTML = `
    <div class="sc-booking-panel">
      <header class="sc-booking-header">
        <h2 id="sc-booking-title">Randevu talebi</h2>
        <button type="button" class="sc-booking-close" data-booking-close aria-label="Randevu penceresini kapat">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </header>
      <p class="sc-booking-intro" id="sc-booking-intro">Uygun gün ve saati WhatsApp’tan paylaşın.</p>
      <div class="sc-booking-quick">
        <a class="sc-booking-quick-wa" data-booking-info target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.7a8.6 8.6 0 0 1-12.7 7.6l-4.3 1.2 1.2-4.2a8.6 8.6 0 1 1 15.8-4.6Z" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 7.6c-.8 1.2-.1 3.3 1.7 5.1 1.8 1.8 3.3 2.5 4.5 1.7l.8-.9-2.2-1.3-.8.7c-1.2-.5-2.3-1.6-2.8-2.8l.7-.8-1.3-2.2-.9.8Z" fill="currentColor"/></svg>
          <span>WhatsApp’a geç</span>
        </a>
        <a class="sc-booking-quick-call" data-booking-call>Stüdyoyu ara</a>
      </div>
      <details class="sc-booking-disclosure" data-booking-disclosure>
        <summary>Talep formu</summary>
        <form class="sc-booking-form" data-booking-form novalidate>
          <fieldset class="sc-booking-services" aria-describedby="sc-booking-services-error">
            <legend>Hangi hizmetle ilgileniyorsunuz? <span>Birden fazla seçebilirsiniz.</span></legend>
            <div class="sc-booking-choices" data-booking-choices></div>
            <p class="sc-booking-error" id="sc-booking-services-error" data-booking-error="services" hidden></p>
          </fieldset>
          <div class="sc-booking-fields">
            <div class="sc-booking-field"><label for="sc-booking-name">Ad Soyad</label><input id="sc-booking-name" name="name" autocomplete="name" maxlength="100" required aria-describedby="sc-booking-name-error"/><p class="sc-booking-error" id="sc-booking-name-error" data-booking-error="name" hidden></p></div>
            <div class="sc-booking-field"><label for="sc-booking-phone">Telefon</label><input id="sc-booking-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="32" required aria-describedby="sc-booking-phone-error"/><p class="sc-booking-error" id="sc-booking-phone-error" data-booking-error="phone" hidden></p></div>
            <div class="sc-booking-field"><label for="sc-booking-time">Saat tercihi <span>(isteğe bağlı)</span></label><input id="sc-booking-time" name="time" type="time" aria-describedby="sc-booking-time-error"/><p class="sc-booking-error" id="sc-booking-time-error" data-booking-error="time" hidden></p></div>
            <div class="sc-booking-field sc-booking-field--note"><label for="sc-booking-note">Notunuz <span>(isteğe bağlı)</span></label><textarea id="sc-booking-note" name="note" rows="3" maxlength="1000" aria-describedby="sc-booking-note-error"></textarea><p class="sc-booking-error" id="sc-booking-note-error" data-booking-error="note" hidden></p></div>
          </div>
          <p class="sc-booking-form-alert" role="alert" data-booking-alert hidden></p>
          <button type="submit" class="sc-booking-submit"><span>WhatsApp taslağını hazırla</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <p class="sc-booking-explanation">Bu form randevu talebi hazırlar. Mesajı WhatsApp’ta siz gönderirsiniz; randevu işletmenin yanıtıyla netleşir. <span data-booking-privacy>Bilgileriniz bu sitede kaydedilmez; WhatsApp mesaj taslağına eklenir.</span></p>
        </form>
        <section class="sc-booking-ready" data-booking-ready hidden aria-label="Hazırlanan talep">
          <p class="sc-booking-ready-title" role="status">Mesajınız hazır.</p>
          <p>WhatsApp’ta mesajı göndererek talebinizi iletebilirsiniz. Randevunuz işletmenin yanıtıyla netleşir.</p>
          <a class="sc-booking-submit" data-booking-draft-link target="_blank" rel="noopener noreferrer"><span>Talebimi WhatsApp’ta aç</span><span aria-hidden="true">↗</span></a>
          <button type="button" class="sc-booking-back" data-booking-back>Bilgilerimi düzenle</button>
        </section>
      </details>
    </div>`;
  const choices = dialog.querySelector('[data-booking-choices]');
  options.forEach((service) => {
    const label = doc.createElement('label');
    const checkbox = doc.createElement('input');
    const text = doc.createElement('span');
    checkbox.type = 'checkbox';
    checkbox.name = 'service';
    checkbox.value = service;
    checkbox.setAttribute('aria-describedby', 'sc-booking-services-error');
    text.textContent = service;
    label.append(checkbox, text);
    choices.append(label);
  });
  const form = dialog.querySelector('[data-booking-form]');
  const ready = dialog.querySelector('[data-booking-ready]');
  const disclosure = dialog.querySelector('[data-booking-disclosure]');
  const closeButton = dialog.querySelector('[data-booking-close]');
  const draftLink = dialog.querySelector('[data-booking-draft-link]');
  const alert = dialog.querySelector('[data-booking-alert]');
  dialog.querySelector('[data-booking-info]').href = infoUrl.href;
  dialog.querySelector('[data-booking-call]').href = `tel:+${number}`;
  doc.body.append(dialog);
  let opener = null;
  let lockedScroll = null;
  let disposed = false;

  function lockScroll() {
    if (lockedScroll) return;
    const body = doc.body;
    const properties = ['position', 'top', 'left', 'right', 'width', 'overflow'];
    lockedScroll = { x: win.scrollX, y: win.scrollY, body: properties.map((name) => [name, body.style.getPropertyValue(name), body.style.getPropertyPriority(name)]), hadClass: doc.documentElement.classList.contains('sc-booking-open') };
    doc.documentElement.classList.add('sc-booking-open');
    body.style.position = 'fixed';
    body.style.top = `${-lockedScroll.y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    if (!lockedScroll) return;
    const previous = lockedScroll;
    lockedScroll = null;
    for (const [name, value, priority] of previous.body) {
      if (value) doc.body.style.setProperty(name, value, priority);
      else doc.body.style.removeProperty(name);
    }
    if (!previous.hadClass) doc.documentElement.classList.remove('sc-booking-open');
    const behavior = doc.documentElement.style.scrollBehavior;
    doc.documentElement.style.scrollBehavior = 'auto';
    win.scrollTo(previous.x, previous.y);
    doc.documentElement.style.scrollBehavior = behavior;
  }
  function clearErrors() {
    dialog.querySelectorAll('[data-booking-error]').forEach((node) => { node.textContent = ''; node.hidden = true; });
    form.querySelectorAll('[aria-invalid]').forEach((node) => node.removeAttribute('aria-invalid'));
    alert.textContent = '';
    alert.hidden = true;
  }
  function reset() {
    form.reset();
    disclosure.open = false;
    form.hidden = false;
    ready.hidden = true;
    draftLink.removeAttribute('href');
    clearErrors();
    dialog.scrollTop = 0;
  }
  function visible(node) {
    if (!(node instanceof win.HTMLElement) || !node.isConnected || !node.getClientRects().length || node.closest('[hidden], [inert]')) return false;
    const collapsed = node.closest('details:not([open])');
    if (collapsed && !collapsed.querySelector('summary')?.contains(node)) return false;
    const style = win.getComputedStyle(node);
    return style.visibility !== 'hidden' && style.visibility !== 'collapse';
  }
  function onClose() {
    if (dialog.open) return;
    unlockScroll();
    reset();
    const fallback = typeof focusFallback === 'function' ? focusFallback() : focusFallback;
    const focus = visible(opener) ? opener : visible(fallback) ? fallback : null;
    opener = null;
    focus?.focus({ preventScroll: true });
  }
  function close() { if (dialog.open) dialog.close(); }
  function onTrigger(event) {
    if (disposed || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const trigger = event.target instanceof win.Element ? event.target.closest('[data-booking-trigger]') : null;
    if (!trigger || !root.contains(trigger)) return;
    try {
      onBeforeOpen();
      reset();
      opener = trigger;
      const service = trigger.dataset.bookingService;
      choices.querySelectorAll('input').forEach((checkbox) => { checkbox.checked = checkbox.value === service; });
      dialog.showModal();
      lockScroll();
      closeButton.focus({ preventScroll: true });
      event.preventDefault();
    } catch {
      if (dialog.open) dialog.close();
      unlockScroll();
      opener = null;
      // Keep the trigger's existing WhatsApp link usable if opening the panel fails.
    }
  }
  function onSubmit(event) {
    event.preventDefault();
    clearErrors();
    const data = new win.FormData(form);
    const fields = { name: data.get('name'), phone: data.get('phone'), services: data.getAll('service'), time: data.get('time'), note: data.get('note') };
    const result = validateBookingFields(fields, options);
    if (!result.valid) {
      for (const [key, message] of Object.entries(result.errors)) {
        const error = dialog.querySelector(`[data-booking-error="${key}"]`);
        error.textContent = message;
        error.hidden = false;
        form.querySelectorAll(`[name="${key === 'services' ? 'service' : key}"]`).forEach((input) => input.setAttribute('aria-invalid', 'true'));
      }
      const key = Object.keys(result.errors)[0];
      form.querySelector(`[name="${key === 'services' ? 'service' : key}"]`)?.focus();
      return;
    }
    try {
      const draft = createBookingDraft({ number, brand, fields: result.values, serviceOptions: options });
      draftLink.href = draft.url;
      form.hidden = true;
      ready.hidden = false;
      dialog.scrollTop = 0;
      // Let native focus reveal the action inside a short or keyboard-sized panel.
      draftLink.focus();
      // This only opens a draft after the visitor submits. It never sends the message.
      try { win.open(draft.url, '_blank', 'noopener,noreferrer'); } catch { /* The visible link remains available. */ }
    } catch {
      alert.textContent = 'Talep hazırlanamadı. Aşağıdaki WhatsApp bağlantısından bize ulaşabilirsiniz.';
      alert.hidden = false;
    }
  }
  function onDialogClick(event) {
    if (event.target.closest('[data-booking-close]')) close();
    else if (event.target.closest('[data-booking-back]')) {
      form.hidden = false;
      ready.hidden = true;
      draftLink.removeAttribute('href');
      form.querySelector('[name="name"]')?.focus();
    } else if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }
  }
  function onCancel(event) { event.preventDefault(); close(); }
  function onDialogKeydown(event) {
    if (event.key !== 'Tab' || !dialog.open) return;
    const targets = [...dialog.querySelectorAll('a[href], button, input, textarea, select, summary, [tabindex]')]
      .filter((node) => node.tabIndex >= 0 && !node.matches(':disabled') && visible(node));
    const first = targets[0];
    const last = targets.at(-1);
    const active = doc.activeElement;
    if (!first || (active !== (event.shiftKey ? first : last) && targets.includes(active))) return;

    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
  root.addEventListener('click', onTrigger);
  form.addEventListener('submit', onSubmit);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('cancel', onCancel);
  dialog.addEventListener('close', onClose);
  dialog.addEventListener('keydown', onDialogKeydown);
  const api = { dispose() {
    if (disposed) return;
    disposed = true;
    root.removeEventListener('click', onTrigger);
    form.removeEventListener('submit', onSubmit);
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('cancel', onCancel);
    dialog.removeEventListener('close', onClose);
    dialog.removeEventListener('keydown', onDialogKeydown);
    close();
    onClose();
    dialog.remove();
    instances.delete(doc);
  } };
  instances.set(doc, api);
  return api;
}
