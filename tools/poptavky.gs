/**
 * Apartment Clara – poptávky z webu https://benalmadenaclara.github.io
 *
 * Web sem pošle poptávku a skript odešle dva e-maily ze schránky, pod kterou běží:
 *   1) hostovi potvrzení, že poptávka dorazila a čeká na potvrzení (v jazyce webu),
 *   2) nám na OWNER_EMAIL se všemi údaji – odpovědí na něj se píše rovnou hostovi.
 *
 * Nasazení (přihlášeni jako benalmadena.clara@gmail.com):
 *   script.google.com → Nový projekt → vložit tento kód → Uložit
 *   → Implementovat → Nová implementace → Typ: Webová aplikace, Spustit jako: Já, Kdo má přístup: Kdokoli
 *   → Implementovat → Autorizovat přístup → adresu webové aplikace (…/exec) vložit do script.js jako inquiryUrl.
 * Po změně kódu: Implementovat → Spravovat implementace → upravit (tužka) → Verze: Nová verze
 *   → Implementovat (adresa zůstane stejná).
 */

const OWNER_EMAIL = 'benalmadena.clara@gmail.com';
const SITE_URL = 'https://benalmadenaclara.github.io';
const LIMIT_PER_EMAIL = 3;   // poptávek z jedné adresy za hodinu
const LIMIT_TOTAL = 30;      // poptávek celkem za 6 hodin (pojistka proti zneužití)

const TEXTS = {
  cs: {
    subject: 'Apartment Clara – poptávka přijata',
    greeting: () => 'Dobrý den,',
    intro: 'děkujeme za poptávku apartmánu Clara v Benalmádeně. Termín zatím není potvrzený – ověříme volno a co nejdříve se vám ozveme.',
    summary: 'Vaše poptávka',
    from: 'Příjezd',
    to: 'Odjezd',
    guests: 'Počet hostů',
    price: 'Orientační cena',
    nights: n => (n === 1 ? 'noc' : n < 5 ? 'noci' : 'nocí'),
    signature: 'S pozdravem\nApartment Clara',
  },
  en: {
    subject: "Apartment Clara – we've received your request",
    greeting: name => `Hello ${name},`,
    intro: "thank you for your request for Apartment Clara in Benalmádena. Your dates are not confirmed yet – we'll check availability and get back to you as soon as possible.",
    summary: 'Your request',
    from: 'Arrival',
    to: 'Departure',
    guests: 'Guests',
    price: 'Estimated price',
    nights: n => (n === 1 ? 'night' : 'nights'),
    signature: 'Kind regards\nApartment Clara',
  },
  es: {
    subject: 'Apartment Clara – hemos recibido tu solicitud',
    greeting: name => `Hola, ${name}:`,
    intro: 'gracias por tu solicitud para Apartment Clara en Benalmádena. Las fechas aún no están confirmadas: comprobaremos la disponibilidad y te responderemos lo antes posible.',
    summary: 'Tu solicitud',
    from: 'Llegada',
    to: 'Salida',
    guests: 'Huéspedes',
    price: 'Precio orientativo',
    nights: n => (n === 1 ? 'noche' : 'noches'),
    signature: 'Un saludo\nApartment Clara',
  },
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.website) return reply({ ok: true });   // skryté pole vyplnil robot – tváříme se, že je hotovo
    const request = validate(data);
    if (tooMany(request.email)) return reply({ ok: false, error: 'limit' });
    sendToGuest(request);
    sendToOwner(request);
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

// kontrola, že skript běží (otevření adresy v prohlížeči nic neposílá)
function doGet() {
  return reply({ ok: true, service: 'Apartment Clara – poptávky' });
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function validate(data) {
  const line = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
  const request = {
    lang: TEXTS[data.lang] ? data.lang : 'en',
    name: line(data.name, 80),
    email: line(data.email, 120),
    from: line(data.from, 10),
    to: line(data.to, 10),
    guests: Math.min(4, Math.max(1, parseInt(data.guests, 10) || 1)),
    message: String(data.message || '').trim().slice(0, 2000),
    price: /^[0-9\s .,€Kč]{1,20}$/.test(data.price || '') ? data.price : '',
  };
  const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!request.name || /https?:|www\.|<|>/i.test(request.name)) throw new Error('jméno');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) throw new Error('e-mail');
  if (!isDate(request.from) || !isDate(request.to) || request.to <= request.from) throw new Error('termín');
  return request;
}

function tooMany(email) {
  const cache = CacheService.getScriptCache();
  const bump = (key, limit, seconds) => {
    const count = Number(cache.get(key) || 0);
    if (count >= limit) return true;
    cache.put(key, String(count + 1), seconds);
    return false;
  };
  return bump('email:' + email.toLowerCase(), LIMIT_PER_EMAIL, 3600) || bump('total', LIMIT_TOTAL, 21600);
}

function nightsBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 864e5);
}

function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  return lang === 'cs' ? `${d}. ${m}. ${y}` : `${d}/${m}/${y}`;
}

// Hostovi jde jen pevný text a údaje z formuláře bez volné zprávy,
// aby formulář nešel zneužít k rozesílání cizího obsahu na cizí adresy.
function sendToGuest(r) {
  const t = TEXTS[r.lang];
  const nights = nightsBetween(r.from, r.to);
  const lines = [
    t.greeting(r.name), '',
    t.intro, '',
    `${t.summary}:`,
    `${t.from}: ${formatDate(r.from, r.lang)}`,
    `${t.to}: ${formatDate(r.to, r.lang)} (${nights} ${t.nights(nights)})`,
    `${t.guests}: ${r.guests}`,
  ];
  if (r.price) lines.push(`${t.price}: ${r.price}`);
  lines.push('', t.signature, SITE_URL);
  MailApp.sendEmail({ to: r.email, subject: t.subject, body: lines.join('\n'), name: 'Apartment Clara', replyTo: OWNER_EMAIL });
}

function sendToOwner(r) {
  const nights = nightsBetween(r.from, r.to);
  const body = [
    'Nová poptávka z webu Apartment Clara:', '',
    `Jméno: ${r.name}`,
    `E-mail: ${r.email}`,
    `Příjezd: ${formatDate(r.from, 'cs')}`,
    `Odjezd: ${formatDate(r.to, 'cs')} (${nights} ${TEXTS.cs.nights(nights)})`,
    `Počet hostů: ${r.guests}`,
    `Orientační cena: ${r.price || '–'}`,
    `Jazyk webu: ${r.lang}`, '',
    'Zpráva:', r.message || '–', '',
    'Odpovědí na tento e-mail napíšete rovnou hostovi.',
    'Po potvrzení zapište pobyt do Google kalendáře „Přímé rezervace“ (celodenní událost od příjezdu do posledního nocování).',
  ].join('\n');
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: `Poptávka ${formatDate(r.from, 'cs')} – ${formatDate(r.to, 'cs')}, ${r.guests} os. – ${r.name}`,
    body,
    name: 'Web Apartment Clara',
    replyTo: r.email,
  });
}
