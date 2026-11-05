/**
 * Apartment Clara – poptávky a obsazenost pro web https://benalmadenaclara.github.io
 *
 * 1) Poptávka (POST): skript odešle e-maily ze schránky, pod kterou běží –
 *    hostovi potvrzení, že poptávka dorazila a čeká na potvrzení (v jazyce webu),
 *    nám na OWNER_EMAIL se všemi údaji (odpovědí na něj se píše rovnou hostovi)
 *    a krátké upozornění s postupem na osobní e-mail z vlastnosti NOTIFY_EMAIL (když je vyplněná).
 * 2) Obsazenost (GET …/exec?availability=1): skript přečte kalendář z Bookingu a Google kalendář
 *    přímých rezervací a webu vrátí jen obsazené noci, žádná jména.
 *    Kontrola: v editoru vybrat funkci testObsazenosti a kliknout na Spustit.
 *
 * 3) Do obou e-mailů pro nás dá odkaz na stránku platba.html, která z údajů poptávky připraví text
 *    potvrzení v jazyce hosta a QR kód pro platbu (údaje jsou v odkazu za #, nikam se neposílají).
 *
 * Adresy kalendářů jsou tajné a osobní e-mail ani účet nemají být ve veřejném kódu, proto jsou
 * v Nastavení projektu → Vlastnosti skriptu: BOOKING_ICAL, DIRECT_ICAL, NOTIFY_EMAIL
 * a pro platby PAYMENT_IBAN (účet pro Kč), PAYMENT_NAME (majitel účtu),
 * případně PAYMENT_IBAN_EUR (jiný účet pro eura) a PAYMENT_BIC.
 *
 * Nasazení (přihlášeni jako benalmadena.clara@gmail.com):
 *   script.google.com → Nový projekt → vložit tento kód → Uložit → doplnit Vlastnosti skriptu
 *   → Implementovat → Nová implementace → Typ: Webová aplikace, Spustit jako: Já, Kdo má přístup: Kdokoli
 *   → Implementovat → Autorizovat přístup → adresu webové aplikace (…/exec) vložit do script.js jako inquiryUrl.
 * Po změně kódu: nejdřív jednou Spustit testObsazenosti (kdyby skript potřeboval nové povolení),
 *   pak Implementovat → Spravovat implementace → upravit (tužka) → Verze: Nová verze → Implementovat
 *   (adresa zůstane stejná).
 */

const OWNER_EMAIL = 'benalmadena.clara@gmail.com';
const SITE_URL = 'https://benalmadenaclara.github.io';
const LIMIT_PER_EMAIL = 3;   // poptávek z jedné adresy za hodinu
const LIMIT_TOTAL = 30;      // poptávek celkem za 6 hodin (pojistka proti zneužití)
const AVAILABILITY_CACHE_SECONDS = 300;  // jak dlouho si skript pamatuje načtenou obsazenost (5 minut)
const HORIZON_DAYS = 550;                // jak daleko dopředu web obsazenost ukazuje (jako tools/availability.py)
const TIME_ZONE = 'Europe/Madrid';

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
    notifyOwner(request);
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err && err.message || err) });
  }
}

// GET: ?availability=1 vrátí obsazenost pro kalendář na webu,
// bez parametrů jen kontrola, že skript běží (otevření adresy v prohlížeči nic neposílá)
function doGet(e) {
  if (e && e.parameter && e.parameter.availability) return reply(availability());
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
    'Potvrzení s QR platbou pro hosta připravíte tady:', paymentLink(r), '',
    'Odpovědí na tento e-mail napíšete rovnou hostovi.',
    'Po potvrzení hned zavřete termín v Bookingu a zapište pobyt do Google kalendáře „Přímé rezervace“ (celodenní událost od příjezdu do posledního nocování).',
  ].join('\n');
  MailApp.sendEmail({
    to: OWNER_EMAIL,
    subject: `Poptávka ${formatDate(r.from, 'cs')} – ${formatDate(r.to, 'cs')}, ${r.guests} os. – ${r.name}`,
    body,
    name: 'Web Apartment Clara',
    replyTo: r.email,
  });
}

// Krátké upozornění s postupem na osobní e-mail (vlastnost skriptu NOTIFY_EMAIL; prázdná = nic se neposílá).
// Odpověď na něj jde do schránky OWNER_EMAIL, ne hostovi – hostovi se odpovídá odtamtud.
// Když se upozornění nepodaří odeslat, poptávka platí dál (host má potvrzení a my poptávku).
function notifyOwner(r) {
  const to = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');
  if (!to) return;
  const nights = nightsBetween(r.from, r.to);
  const dates = `${formatDate(r.from, 'cs')} – ${formatDate(r.to, 'cs')}`;
  const lines = [
    `Na webu přišla nová poptávka: ${r.name}, ${dates} (${nights} ${TEXTS.cs.nights(nights)}), ${r.guests} os.${r.price ? `, orientačně ${r.price}` : ''}.`,
  ];
  if (r.message) lines.push('', 'Zpráva hosta:', r.message);
  lines.push(
    '',
    'Co dál:',
    `1. Odpovězte hostovi ze schránky ${OWNER_EMAIL} – poptávka tam čeká, stačí dát Odpovědět a odpověď půjde rovnou hostovi. Z tohoto e-mailu hostovi nepište.`,
    `2. Text potvrzení v jazyce hosta a QR kód pro platbu připravíte tady: ${paymentLink(r)}`,
    '3. Když termín potvrdíte, hned ho zavřete v Bookingu (v extranetu nebo v aplikaci) – kalendář přímých rezervací si Booking stahuje až po několika hodinách.',
    '4. Pobyt zapište do Google kalendáře „Přímé rezervace“ jako celodenní událost od příjezdu do posledního nocování.',
  );
  try {
    MailApp.sendEmail({ to, subject: `Nová poptávka ${dates}, ${r.guests} os. – ${r.name}`, body: lines.join('\n'), name: 'Web Apartment Clara' });
  } catch (err) {
    console.error(err);
  }
}

// Odkaz na platba.html s údaji z poptávky a účtem z vlastností skriptu. Vše je za #, takže to prohlížeč
// nikam neposílá; cenu bere z textu, který spočítal web („8 764 Kč“, „€450“).
function paymentLink(r) {
  const props = PropertiesService.getScriptProperties();
  const amount = String(r.price || '').replace(/\D/g, '');
  const params = {
    lang: r.lang, name: r.name, email: r.email, from: r.from, to: r.to, guests: r.guests,
    amount, cur: amount ? (/Kč/.test(r.price) ? 'CZK' : 'EUR') : '',
    iban: props.getProperty('PAYMENT_IBAN'), ibanEur: props.getProperty('PAYMENT_IBAN_EUR'),
    bic: props.getProperty('PAYMENT_BIC'), holder: props.getProperty('PAYMENT_NAME'),
  };
  return `${SITE_URL}/platba.html#` + Object.keys(params)
    .filter(key => params[key])
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&');
}

// ===== Obsazenost: stejný výpočet jako tools/availability.py (ten plní zálohu availability.json na GitHubu) =====

function availability() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('availability');
  if (cached) return JSON.parse(cached);
  try {
    const props = PropertiesService.getScriptProperties();
    const names = ['BOOKING_ICAL', 'DIRECT_ICAL'];
    const urls = names.map(name => props.getProperty(name));
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

// Kontrola v editoru: vybrat tuto funkci a kliknout na Spustit (poprvé si řekne o povolení přístupu)
function testObsazenosti() {
  CacheService.getScriptCache().remove('availability');
  const result = availability();
  console.log(result.ok
    ? `V pořádku – obsazená období: ${result.busy.length}, nejbližší ${result.busy.length ? result.busy[0].join(' až ') : '–'}.`
    : 'Obsazenost se nenačetla, důvod je na řádku výš.');
}
