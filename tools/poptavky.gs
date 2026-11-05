/**
 * Apartment Clara – poptávky, rezervace a obsazenost pro web https://benalmadenaclara.github.io
 * (běží pod účtem benalmadena.clara@gmail.com a poštu posílá z té schránky)
 *
 * 1) Poptávka z formuláře na webu (POST bez action): uloží rezervaci, hostovi pošle „poptávka dorazila,
 *    čeká na potvrzení“ (bez platebních údajů) a nám upozornění s odkazem na stránku rezervace
 *    (do OWNER_EMAIL i na NOTIFY_EMAIL).
 * 2) Stránka rezervace.html (jen pro nás):
 *    GET ?booking=ID → údaje, platební účet a celá e-mailová konverzace s hostem (z Gmailu),
 *    GET ?list=1 → přehled všech rezervací,
 *    POST s action reply | confirm | paid | unpaid | cancel | reopen | delete → odpověď hostovi, potvrzení
 *    s QR kódem pro platbu (QR jako vložený obrázek, zobrazí ho i Gmail), poděkování za platbu, změna stavu,
 *    smazání zrušené rezervace.
 *    Přístup: odkazy v našich e-mailech nesou klíč k přehledu (key), starší odkazy podpis jedné rezervace (t)
 *    – obojí HMAC s tajným klíčem LINK_SECRET, který si skript vytvoří sám. Bez nich skript nic neukáže ani nepošle.
 * 3) Hlídání (spouštěče vytvoří funkce nastavit): každých 10 minut nové e-maily od hostů → upozornění
 *    na NOTIFY_EMAIL; každý den v 9:00 připomínka platby 1, 3 a 7 dní po potvrzení, dokud není platba
 *    označená jako přijatá, a smazání rezervací rok po odjezdu.
 * 4) Obsazenost (GET ?availability=1) pro kalendář na webu – jen obsazené noci, žádná jména.
 *
 * Vlastnosti skriptu (Nastavení projektu → Vlastnosti skriptu) – tajné a osobní údaje mimo veřejný kód:
 *   BOOKING_ICAL, DIRECT_ICAL – adresy kalendářů; NOTIFY_EMAIL – osobní e-mail pro upozornění;
 *   PAYMENT_IBAN – účet pro platby v Kč; PAYMENT_NAME – majitel účtu; nepovinně PAYMENT_IBAN_EUR a PAYMENT_BIC.
 *   Rezervace (b_…), LINK_SECRET a MAIL_CHECKED si tam skript ukládá sám.
 *
 * Nasazení (přihlášeni jako benalmadena.clara@gmail.com):
 *   script.google.com → Nový projekt → vložit tento kód → Uložit → doplnit Vlastnosti skriptu
 *   → vybrat funkci nastavit → Spustit → povolit přístup (pošle odkaz na přehled rezervací)
 *   → Implementovat → Nová implementace → Webová aplikace, Spustit jako: Já, Kdo má přístup: Kdokoli
 *   → adresu webové aplikace (…/exec) vložit do script.js (inquiryUrl) a rezervace.html (SCRIPT_URL).
 * Po změně kódu: jednou Spustit funkci nastavit, pak Implementovat → Spravovat implementace → tužka
 *   → Verze: Nová verze → Implementovat (adresa zůstane stejná).
 */

const OWNER_EMAIL = 'benalmadena.clara@gmail.com';
const SITE_URL = 'https://benalmadenaclara.github.io';
const PAGE_URL = SITE_URL + '/rezervace.html';
const LIMIT_PER_EMAIL = 3;     // poptávek z jedné adresy za hodinu
const LIMIT_TOTAL = 30;        // poptávek celkem za 6 hodin (pojistka proti zneužití)
const LIMIT_SENDS = 30;        // e-mailů hostům ze stránky rezervace za hodinu (pojistka)
const REMINDER_DAYS = [1, 3, 7];   // připomínky platby (dny po potvrzení)
const KEEP_DAYS = 365;             // rezervace se smaže rok po odjezdu
const AVAILABILITY_CACHE_SECONDS = 300;  // jak dlouho si skript pamatuje načtenou obsazenost (5 minut)
const HORIZON_DAYS = 550;                // jak daleko dopředu web obsazenost ukazuje (jako tools/availability.py)
const TIME_ZONE = 'Europe/Madrid';
const OWNER_ZONE = 'Europe/Prague';      // časy v e-mailech pro nás a připomínky v 9:00

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

// ===== vstupy webové aplikace =====

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action) return reply(bookingAction(data));   // akce ze stránky rezervace.html
    if (data.website) return reply({ ok: true });   // skryté pole vyplnil robot – tváříme se, že je hotovo
    const request = validate(data);
    if (tooMany(request.email)) return reply({ ok: false, error: 'limit' });
    const booking = saveBooking(newBooking(request));
    sendToGuest(booking);
    sendToOwner(booking);
    notifyOwner(booking);
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

// GET: ?availability=1 obsazenost pro kalendář, ?booking=… a ?list=1 pro stránku rezervace,
// bez parametrů jen kontrola, že skript běží (otevření adresy v prohlížeči nic neposílá)
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    if (p.availability) return reply(availability());
    if (p.list) return reply(bookingList(p));
    if (p.booking) return reply(bookingDetail(p));
    return reply({ ok: true, service: 'Apartment Clara – poptávky' });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

// ===== poptávka z webu =====

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
    price: /^[0-9\s .,€Kč]{1,20}$/.test(data.price || '') ? data.price : '',
  };
  if (!request.name || /https?:|www\.|<|>/i.test(request.name)) throw new Error('jméno');
  if (!isEmail(request.email)) throw new Error('e-mail');
  if (!isDate(request.from) || !isDate(request.to) || request.to <= request.from) throw new Error('termín');
  return request;
}

const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value);

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

const datesCs = b => `${formatDate(b.from, 'cs')} – ${formatDate(b.to, 'cs')}`;
const stampCs = iso => Utilities.formatDate(new Date(iso), OWNER_ZONE, 'd. M. yyyy H:mm');

// Hostovi jde jen pevný text a údaje z formuláře bez volné zprávy,
// aby formulář nešel zneužít k rozesílání cizího obsahu na cizí adresy.
function sendToGuest(b) {
  const t = TEXTS[b.lang];
  const nights = nightsBetween(b.from, b.to);
  const lines = [
    t.greeting(b.name), '',
    t.intro, '',
    `${t.summary}:`,
    `${t.from}: ${formatDate(b.from, b.lang)}`,
    `${t.to}: ${formatDate(b.to, b.lang)} (${nights} ${t.nights(nights)})`,
    `${t.guests}: ${b.guests}`,
  ];
  if (b.price) lines.push(`${t.price}: ${b.price}`);
  lines.push('', t.signature, SITE_URL);
  GmailApp.sendEmail(b.email, t.subject, lines.join('\n'), { name: 'Apartment Clara', replyTo: OWNER_EMAIL });
}

// Poptávka do schránky benalmadena.clara – bez „odpovědět hostovi“, hostovi se píše přes stránku rezervace
// (odkaz v e-mailu nese podpis rezervace, proto nemá odejít hostovi v citaci odpovědi).
function sendToOwner(b) {
  const nights = nightsBetween(b.from, b.to);
  const body = [
    'Nová poptávka z webu Apartment Clara:', '',
    `Jméno: ${b.name}`,
    `E-mail: ${b.email}`,
    `Příjezd: ${formatDate(b.from, 'cs')}`,
    `Odjezd: ${formatDate(b.to, 'cs')} (${nights} ${TEXTS.cs.nights(nights)})`,
    `Počet hostů: ${b.guests}`,
    `Orientační cena: ${b.price || '–'}`,
    `Jazyk webu: ${b.lang}`, '',
    'Zpráva hosta:', b.message || '–', '',
    'Rezervaci vyřídíte tady – odpověď hostovi, potvrzení s platebními údaji a QR kódem, označení platby:',
    bookingLink(b), '',
    'Po potvrzení hned zavřete termín v Bookingu a zapište pobyt do Google kalendáře „Přímé rezervace“ (celodenní událost od příjezdu do posledního nocování).',
    'Tento e-mail hostovi nepřeposílejte (odkaz je jen pro nás).',
  ].join('\n');
  GmailApp.sendEmail(OWNER_EMAIL, `Poptávka ${datesCs(b)}, ${b.guests} os. – ${b.name}`, body, { name: 'Web Apartment Clara' });
}

// Upozornění na osobní e-mail (NOTIFY_EMAIL); když není vyplněný, stačí e-mail do schránky benalmadena.clara.
function notifyOwner(b) {
  if (!props().getProperty('NOTIFY_EMAIL')) return;
  const nights = nightsBetween(b.from, b.to);
  notify(`Nová poptávka ${datesCs(b)}, ${b.guests} os. – ${b.name}`, [
    `Na webu přišla nová poptávka: ${b.name}, ${datesCs(b)} (${nights} ${TEXTS.cs.nights(nights)}), ${b.guests} os.${b.price ? `, orientačně ${b.price}` : ''}.`,
    ...(b.message ? ['', 'Zpráva hosta:', b.message] : []),
    '',
    `Rezervace – odpovědět, potvrdit s platebními údaji, označit platbu: ${bookingLink(b)}`,
    `Přehled všech rezervací: ${overviewLink()}`,
    '',
    'Až termín potvrdíte, hned ho zavřete v Bookingu a zapište do Google kalendáře „Přímé rezervace“.',
  ]);
}

function notify(subject, lines) {
  const to = props().getProperty('NOTIFY_EMAIL') || OWNER_EMAIL;
  try {
    GmailApp.sendEmail(to, subject, lines.join('\n'), { name: 'Web Apartment Clara' });
  } catch (err) {
    console.error(err);   // upozornění je doplněk, kvůli němu nesmí spadnout poptávka ani hlídání
  }
}

// ===== rezervace (ukládají se do vlastností skriptu jako b_ID) =====

const props = () => PropertiesService.getScriptProperties();

function newBooking(r) {
  return {
    id: Utilities.getUuid().replace(/-/g, '').slice(0, 12),
    created: new Date().toISOString(),
    lang: r.lang, name: r.name, email: r.email, from: r.from, to: r.to, guests: r.guests,
    price: r.price, message: r.message,
    status: 'new',   // new → confirmed → paid; nebo cancelled
    reminders: [],
  };
}

function saveBooking(b) {
  props().setProperty('b_' + b.id, JSON.stringify(b));
  return b;
}

function loadBooking(id) {
  const raw = /^[a-f0-9]{8,32}$/.test(String(id)) ? props().getProperty('b_' + id) : null;
  return raw ? JSON.parse(raw) : null;
}

function allBookings() {
  const all = props().getProperties();
  return Object.keys(all).filter(key => key.indexOf('b_') === 0).map(key => JSON.parse(all[key]));
}

// ===== podepsané odkazy =====

function sign(value) {
  let secret = props().getProperty('LINK_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props().setProperty('LINK_SECRET', secret);
  }
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value, secret)).slice(0, 22);
}

const bookingToken = id => sign('booking:' + id);   // starší odkazy na jednu rezervaci (#id=…&t=…) platí dál
const adminKey = () => sign('admin');
// odkaz z našich e-mailů otevře rezervaci i přehled ostatních (proto ho nikomu nepřeposílat)
const bookingLink = b => `${PAGE_URL}#key=${adminKey()}&id=${b.id}`;
const overviewLink = () => `${PAGE_URL}#key=${adminKey()}`;

// rezervace, pokud odkaz nese její podpis (t) nebo klíč k přehledu (key)
function authorized(p) {
  const booking = loadBooking(p.id || p.booking || '');
  if (!booking) return null;
  const admin = Boolean(p.key) && p.key === adminKey();
  if (!admin && (!p.t || p.t !== bookingToken(booking.id))) return null;
  return { booking, admin };
}

// ===== stránka rezervace: čtení =====

function bookingDetail(p) {
  const access = authorized(p);
  if (!access) return { ok: false, error: 'odkaz' };
  const b = access.booking;
  if (b.unread) {
    b.unread = false;
    saveBooking(b);
  }
  const P = props();
  return {
    ok: true,
    admin: access.admin,
    booking: b,
    history: history(b),
    bank: {
      iban: P.getProperty('PAYMENT_IBAN') || '',
      ibanEur: P.getProperty('PAYMENT_IBAN_EUR') || '',
      bic: P.getProperty('PAYMENT_BIC') || '',
      holder: P.getProperty('PAYMENT_NAME') || '',
    },
  };
}

function bookingList(p) {
  if (!p.key || p.key !== adminKey()) return { ok: false, error: 'odkaz' };
  const fields = ['id', 'created', 'name', 'email', 'from', 'to', 'guests', 'price', 'lang', 'status',
    'confirmedAt', 'paidAt', 'cancelledAt', 'unread', 'lastGuestAt'];
  return { ok: true, bookings: allBookings().map(b => Object.fromEntries(fields.map(field => [field, b[field]]))) };
}

// E-mailová konverzace s hostem k této rezervaci (odeslané i přijaté) + zpráva z formuláře na začátku.
// Jen zprávy od vzniku rezervace do vzniku další rezervace téhož hosta a bez našich interních upozornění
// (odesílatel „Web Apartment Clara“) – jinak by se opakovala třeba potvrzení z dřívějších poptávek.
function history(b) {
  const email = b.email.toLowerCase();
  const start = Date.parse(b.created) - 5 * 60e3;
  const later = allBookings()
    .filter(other => other.id !== b.id && other.email.toLowerCase() === email && other.created > b.created)
    .map(other => Date.parse(other.created) - 60e3);
  const end = later.length ? Math.min(...later) : Infinity;
  const items = b.message ? [{ at: b.created, guest: true, subject: 'Zpráva z formuláře na webu', text: b.message }] : [];
  const seen = {};
  GmailApp.search(`from:${email} OR to:${email}`, 0, 30).forEach(thread => thread.getMessages().forEach(message => {
    const at = message.getDate().getTime();
    if (seen[message.getId()] || at < start || at >= end || /Web Apartment Clara/.test(message.getFrom())) return;
    seen[message.getId()] = true;
    const from = addressOf(message.getFrom());
    const recipients = `${message.getTo()},${message.getCc()}`.toLowerCase();
    if (from !== email && recipients.indexOf(email) === -1) return;
    items.push({ at: new Date(at).toISOString(), guest: from === email, subject: message.getSubject(), text: cleanBody(message.getPlainBody()) });
  }));
  return items.sort((x, y) => (x.at < y.at ? -1 : x.at > y.at ? 1 : 0)).slice(-40);
}

function addressOf(header) {
  const match = String(header || '').match(/<([^>]+)>/);
  return (match ? match[1] : String(header || '')).trim().toLowerCase();
}

// text e-mailu bez citace předchozích zpráv („Dne … napsal:“, „On … wrote:“, řádky s >)
function cleanBody(text) {
  let body = '\n' + String(text || '').replace(/\r\n?/g, '\n');
  [
    /\n[^\n]*[\d@][^\n]*(?:wrote|napsal|escribió|schrieb|a écrit)[^\n]*:[ \t]*(?=\n|$)/i,   // „On … wrote:“ na jednom řádku
    /\n-{2,}[ \t]*(?:Original Message|Původní e-mail|Původní zpráva|Mensaje original|Forwarded message|Přeposlaná zpráva)/i,
    /\n_{8,}[ \t]*\n(?:From|Od|De):/i,   // Outlook
    /\n>/,
  ].forEach(pattern => {
    const index = body.search(pattern);
    if (index >= 0) body = body.slice(0, index);
  });
  // zbytek zalomeného úvodu citace: „napsal:“ na samostatném řádku a „Dne/On/El …“ před ním
  body = body.replace(/\n[^\n]*(?:wrote|napsal|escribió|schrieb|a écrit)[^\n]*:[ \t]*$/i, '');
  body = body.replace(/\n(?:On|Dne|El|Am|Le)\s[^\n]*$/, '');
  return body.trim().slice(0, 3000);
}

// ===== stránka rezervace: akce =====

function bookingAction(data) {
  const access = authorized(data);
  if (!access) return { ok: false, error: 'odkaz' };
  const b = access.booking;
  const now = new Date().toISOString();
  const text = value => String(value || '').slice(0, 8000);

  if (data.action === 'cancel') {
    b.status = 'cancelled';
    b.cancelledAt = now;
  } else if (data.action === 'reopen') {
    b.status = b.paidAt ? 'paid' : b.confirmedAt ? 'confirmed' : 'new';
    delete b.cancelledAt;
  } else if (data.action === 'unpaid') {
    delete b.paidAt;
    b.status = b.confirmedAt ? 'confirmed' : 'new';
  } else if (data.action === 'delete') {   // natrvalo, jen zrušenou (třeba zkušební); e-maily v Gmailu zůstanou
    if (b.status !== 'cancelled') return { ok: false, error: 'nejdřív zrušit' };
    props().deleteProperty('b_' + b.id);
    return { ok: true };
  } else if (['reply', 'confirm', 'paid'].indexOf(data.action) !== -1) {
    const mail = data.action !== 'paid' || data.send !== false;
    if (mail && tooManySends()) return { ok: false, error: 'limit' };
    if (data.action === 'reply') {
      if (!String(data.text || '').trim()) return { ok: false, error: 'prázdná zpráva' };
      sendReply(b, text(data.text));
      return { ok: true };
    }
    if (data.action === 'confirm') {
      const sent = sendHtmlMail(b, { subject: data.subject, text: text(data.text), before: text(data.before), after: text(data.after), qr: data.qr });
      if (!sent.ok) return sent;
      const stay = data.stay || {};
      if (isDate(stay.from) && isDate(stay.to) && stay.to > stay.from) Object.assign(b, { from: stay.from, to: stay.to });
      if (stay.guests) b.guests = Math.min(4, Math.max(1, parseInt(stay.guests, 10) || b.guests));
      b.pay = cleanPay(data.pay);
      b.confirmedAt = now;
      b.reminders = [];
      b.status = b.paidAt ? 'paid' : 'confirmed';
    } else {
      if (mail) {
        const sent = sendHtmlMail(b, { subject: data.subject, text: text(data.text), before: text(data.text), after: '' });
        if (!sent.ok) return sent;
      }
      b.paidAt = now;
      b.status = 'paid';
    }
  } else {
    return { ok: false, error: 'akce' };
  }
  saveBooking(b);
  return { ok: true };
}

function tooManySends() {
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('sends') || 0);
  if (count >= LIMIT_SENDS) return true;
  cache.put('sends', String(count + 1), 3600);
  return false;
}

function cleanPay(pay) {
  const p = pay || {};
  const whole = value => Math.max(0, Math.round(Number(value) || 0));
  return {
    amount: whole(p.amount), cur: p.cur === 'EUR' ? 'EUR' : 'CZK', deposit: whole(p.deposit),
    due: isDate(p.due) ? p.due : '', balanceDue: isDate(p.balanceDue) ? p.balanceDue : '',
    vs: String(p.vs || '').replace(/\D/g, '').slice(0, 10),
  };
}

// HTML e-mail hostovi: text before, případně QR kód jako vložený obrázek (cid), text after;
// k tomu textová verze pro programy bez HTML. Odchází přes Gmail, takže je vidět v Odeslaných i v konverzaci.
function sendHtmlMail(b, m) {
  const options = { name: 'Apartment Clara', replyTo: OWNER_EMAIL };
  let image = '';
  if (m.qr) {
    const bytes = Utilities.base64Decode(String(m.qr));
    const png = bytes.length < 300000 && bytes[0] === -119 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;   // podpis souboru PNG
    if (!png) return { ok: false, error: 'qr' };
    options.inlineImages = { qr: Utilities.newBlob(bytes, 'image/png', 'qr-platba.png') };
    image = '<p style="margin:0 0 14px"><img src="cid:qr" alt="QR" width="240" style="display:block;width:240px;max-width:100%;height:auto;border:0"></p>';
  }
  options.htmlBody = htmlWrap(toHtml(m.before) + image + toHtml(m.after));
  const subject = String(m.subject || 'Apartment Clara').replace(/\s+/g, ' ').trim().slice(0, 150);
  GmailApp.sendEmail(b.email, subject, m.text, options);
  return { ok: true };
}

// Odpověď hostovi: když už nám host psal, jde jako odpověď v jeho vlákně, jinak jako nový e-mail.
function sendReply(b, text) {
  const options = { name: 'Apartment Clara', htmlBody: htmlWrap(toHtml(text)) };
  const email = b.email.toLowerCase();
  const thread = GmailApp.search(`from:${email}`, 0, 1)[0];
  const fromGuest = thread ? thread.getMessages().filter(m => addressOf(m.getFrom()) === email) : [];
  if (fromGuest.length) {
    fromGuest[fromGuest.length - 1].reply(text, options);
  } else {
    options.replyTo = OWNER_EMAIL;
    GmailApp.sendEmail(b.email, `Apartment Clara – ${formatDate(b.from, b.lang)} – ${formatDate(b.to, b.lang)}`, text, options);
  }
}

const htmlWrap = inner => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#0E2A3B">${inner}</div>`;

function toHtml(text) {
  const escape = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return String(text || '').split(/\n{2,}/)
    .filter(paragraph => paragraph.trim())
    .map(paragraph => `<p style="margin:0 0 14px">${escape(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

// ===== hlídání (spouštěče z funkce nastavit) =====

// Každých 10 minut: nové e-maily od hostů → značka „nová zpráva“ u rezervace a upozornění na NOTIFY_EMAIL
function kontrolaZprav() {
  const P = props();
  const now = Date.now();
  const since = Number(P.getProperty('MAIL_CHECKED') || now - 3600e3) - 10 * 60e3;   // překryv kvůli zpožděné poště
  const byEmail = {};
  allBookings()
    .filter(b => b.status !== 'cancelled')
    .sort((x, y) => (x.created < y.created ? -1 : 1))
    .forEach(b => { byEmail[b.email.toLowerCase()] = b; });   // u opakovaného hosta vyhraje nejnovější rezervace
  const cache = CacheService.getScriptCache();
  GmailApp.search('in:inbox -from:me newer_than:2d', 0, 50).forEach(thread => thread.getMessages().forEach(message => {
    const at = message.getDate().getTime();
    const b = byEmail[addressOf(message.getFrom())];
    if (!b || at <= since || cache.get('seen_' + message.getId())) return;
    cache.put('seen_' + message.getId(), '1', 21600);
    b.unread = true;
    b.lastGuestAt = new Date(at).toISOString();
    saveBooking(b);
    notify(`Nová zpráva od hosta: ${b.name} (${datesCs(b)})`, [
      `${b.name} napsal(a) ${stampCs(b.lastGuestAt)}:`, '',
      cleanBody(message.getPlainBody()).slice(0, 1500), '',
      `Odpovědět a zobrazit celou konverzaci: ${bookingLink(b)}`,
      `Přehled všech rezervací: ${overviewLink()}`,
    ]);
  }));
  P.setProperty('MAIL_CHECKED', String(now));
}

// Každý den v 9:00: připomínky nezaplacených rezervací a smazání rezervací rok po odjezdu
function denniKontrola() {
  const now = Date.now();
  const today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
  allBookings().forEach(b => {
    if (b.to && addDays(b.to, KEEP_DAYS) < today) {
      props().deleteProperty('b_' + b.id);
      return;
    }
    if (b.status !== 'confirmed' || !b.confirmedAt) return;
    const days = Math.floor((now - Date.parse(b.confirmedAt)) / 864e5);
    const reminders = b.reminders || [];
    const due = REMINDER_DAYS.filter(n => days >= n && reminders.indexOf(n) === -1);
    if (!due.length) return;
    b.reminders = reminders.concat(due);
    saveBooking(b);
    const pay = b.pay || {};
    const amount = pay.deposit && pay.deposit < pay.amount ? pay.deposit : pay.amount;
    notify(`Platba zatím neoznačená: ${b.name} (${datesCs(b)})`, [
      `Rezervace ${b.name} (${datesCs(b)}): potvrzení s platebními údaji odešlo ${stampCs(b.confirmedAt)} (před ${days} ${days === 1 ? 'dnem' : 'dny'}), platba ale zatím není označená jako přijatá.`,
      ...(amount ? [`Čekáme na ${groupThousands(amount)} ${pay.cur === 'EUR' ? '€' : 'Kč'}${pay.deposit && pay.deposit < pay.amount ? ' (záloha)' : ''}${pay.due ? `, splatnost ${formatDate(pay.due, 'cs')}` : ''}${pay.vs ? `, VS ${pay.vs}` : ''}.`] : []),
      '',
      'Zkontrolujte účet. Když peníze přišly, otevřete rezervaci a klikněte na Platba přišla – host dostane poděkování a připomínky přestanou chodit.',
      `Rezervace: ${bookingLink(b)}`,
      `Přehled všech rezervací: ${overviewLink()}`,
    ]);
  });
}

const groupThousands = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Spustit jednou v editoru (a po každé změně kódu): povolí přístupy, nastaví hlídání a pošle odkaz na přehled
function nastavit() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => ['kontrolaZprav', 'denniKontrola'].indexOf(trigger.getHandlerFunction()) !== -1)
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('kontrolaZprav').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('denniKontrola').timeBased().atHour(9).everyDays(1).inTimezone(OWNER_ZONE).create();
  if (!props().getProperty('MAIL_CHECKED')) props().setProperty('MAIL_CHECKED', String(Date.now()));
  const link = overviewLink();
  const recipients = [OWNER_EMAIL, props().getProperty('NOTIFY_EMAIL')].filter(Boolean).join(',');
  GmailApp.sendEmail(recipients, 'Apartment Clara – přehled rezervací', [
    'Odkaz na přehled všech rezervací z webu (uložte si ho do záložek a nikomu ho neposílejte):',
    link, '',
    'Každá nová poptávka přijde i s vlastním odkazem na rezervaci – tam je konverzace s hostem,',
    'odpověď, potvrzení s platebními údaji a QR kódem a tlačítko Platba přišla.',
  ].join('\n'), { name: 'Web Apartment Clara' });
  console.log(`Hotovo: hlídání nastavené, odkaz na přehled odešel na ${recipients}: ${link}`);
}

// ===== Obsazenost: stejný výpočet jako tools/availability.py (ten plní zálohu availability.json na GitHubu) =====

function availability() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('availability');
  if (cached) return JSON.parse(cached);
  try {
    const P = props();
    const names = ['BOOKING_ICAL', 'DIRECT_ICAL'];
    const urls = names.map(name => P.getProperty(name));
    names.forEach((name, i) => { if (!urls[i]) throw new Error(`Ve vlastnostech skriptu chybí ${name}.`); });
    const ranges = [];
    UrlFetchApp.fetchAll(urls.map(url => ({ url, muteHttpExceptions: true }))).forEach((response, i) => {
      const ics = response.getContentText();
      if (response.getResponseCode() !== 200 || ics.indexOf('BEGIN:VCALENDAR') === -1) {
        throw new Error(`Kalendář ${names[i]} se nenačetl (kód ${response.getResponseCode()}).`);
      }
      ranges.push(...busyRanges(ics));
    });
    const today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
    const result = { ok: true, checked: today, busy: mergeRanges(ranges, today, addDays(today, HORIZON_DAYS)) };
    cache.put('availability', JSON.stringify(result), AVAILABILITY_CACHE_SECONDS);
    return result;
  } catch (err) {
    console.error(err);   // podrobnosti jen do protokolu skriptu, webu nic – adresy kalendářů jsou tajné
    return { ok: false, error: 'obsazenost' };
  }
}

// [příjezd, odjezd] jako 'RRRR-MM-DD'; odjezd se nepočítá, stejně jako DTEND v iCal
function busyRanges(ics) {
  const text = ics.replace(/\r?\n[ \t]/g, '');   // zalomené řádky iCal patří k předchozímu řádku
  const iso = value => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  const ranges = [];
  (text.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || []).forEach(event => {
    if (/^STATUS:CANCELLED/m.test(event)) return;
    const start = event.match(/^DTSTART[^:\n]*:(\d{8})/m);
    if (!start) return;
    const end = event.match(/^DTEND[^:\n]*:(\d{8})/m);
    const first = iso(start[1]);
    const last = end ? iso(end[1]) : first;
    ranges.push([first, last > first ? last : addDays(first, 1)]);
  });
  return ranges;
}

// ořízne období na dnešek až horizont a spojí ta, která se překrývají nebo na sebe navazují
function mergeRanges(ranges, today, horizon) {
  const merged = [];
  ranges.map(range => range.join('/')).sort().forEach(key => {
    let [first, last] = key.split('/');
    if (first < today) first = today;
    if (last > horizon) last = horizon;
    if (last <= first) return;
    const previous = merged[merged.length - 1];
    if (previous && first <= previous[1]) {
      if (last > previous[1]) previous[1] = last;
    } else {
      merged.push([first, last]);
    }
  });
  return merged;
}

function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Kontrola v editoru: vybrat tuto funkci a kliknout na Spustit
function testObsazenosti() {
  CacheService.getScriptCache().remove('availability');
  const result = availability();
  console.log(result.ok
    ? `V pořádku – obsazená období: ${result.busy.length}, nejbližší ${result.busy.length ? result.busy[0].join(' až ') : '–'}.`
    : 'Obsazenost se nenačetla, důvod je na řádku výš.');
}
