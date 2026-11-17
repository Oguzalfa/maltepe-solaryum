export const DEFAULT_BOOKING_SERVICES = Object.freeze([
  'Protez Tırnak',
  'İpek Kirpik',
  'Kirpik Lifting',
  'Kalıcı Makyaj',
  'Solaryum',
]);

const singleLine = (value) => String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

export function normaliseRecipient(number) {
  const value = String(number ?? '').trim();
  if (!/^[1-9]\d{9,14}$/.test(value)) {
    throw new TypeError('Geçerli bir WhatsApp işletme numarası gerekli.');
  }
  return value;
}

export function validateBookingFields(fields = {}, serviceOptions = DEFAULT_BOOKING_SERVICES) {
  const allowed = new Set(serviceOptions);
  const errors = {};
  const name = singleLine(fields.name);
  const phone = String(fields.phone ?? '').trim();
  const services = Array.isArray(fields.services)
    ? [...new Set(fields.services.map(singleLine).filter(Boolean))]
    : [];
  const time = String(fields.time ?? '').trim();
  const note = String(fields.note ?? '').replace(/\r\n?/g, '\n').trim();

  if (!name) errors.name = 'Lütfen adınızı ve soyadınızı yazın.';
  else if (name.length > 100) errors.name = 'Ad soyad en fazla 100 karakter olabilir.';
  const digits = phone.replace(/\D/g, '');
  if (!phone) errors.phone = 'Lütfen telefon numaranızı yazın.';
  else if (!/^\+?[\d ().-]+$/.test(phone) || !/^\d{10,15}$/.test(digits)) {
    errors.phone = 'Lütfen alan koduyla birlikte 10–15 rakamlı bir telefon numarası yazın.';
  }
  if (!services.length) errors.services = 'Lütfen en az bir hizmet seçin.';
  else if (services.some((service) => !allowed.has(service))) errors.services = 'Lütfen listedeki hizmetlerden seçim yapın.';
  if (time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) errors.time = 'Lütfen geçerli bir saat seçin.';
  if (note.length > 1000) errors.note = 'Notunuz en fazla 1000 karakter olabilir.';

  return { valid: Object.keys(errors).length === 0, errors, values: { name, phone, services, time, note } };
}

export function createBookingDraft({ number, brand, fields, serviceOptions = DEFAULT_BOOKING_SERVICES }) {
  const recipient = normaliseRecipient(number);
  const result = validateBookingFields(fields, serviceOptions);
  if (!result.valid) {
    const error = new TypeError('Randevu talebi bilgilerini kontrol edin.');
    error.fieldErrors = result.errors;
    throw error;
  }
  const { name, phone, services, time, note } = result.values;
  const business = singleLine(brand) || 'Şükrü Çankırılı Güzellik Merkezi';
  const lines = [
    `Merhaba, ${business} için randevu talebim var.`,
    `Hizmet: ${services.join(', ')}`,
    `Ad soyad: ${name}`,
    `Telefon: ${phone}`,
  ];
  if (time) lines.push(`Tercih edilen saat: ${time}`);
  if (note) lines.push(`Not: ${note}`);
  const message = lines.join('\n');
  const url = new URL(`https://wa.me/${recipient}`);
  url.searchParams.set('text', message);
  return { url: url.href, message };
}
