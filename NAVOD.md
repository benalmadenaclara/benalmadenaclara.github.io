# Web Apartment Clara – návod

Jednostránkový web ve třech jazycích (CZ / EN / ES) s kalendářem obsazenosti a poptávkou přímé rezervace.
Adresa: **https://benalmadenaclara.github.io** – běží na GitHub Pages z repozitáře
https://github.com/benalmadenaclara/benalmadenaclara.github.io (účet `benalmadenaclara`).
Každá změna nahraná do větve `main` se zveřejní automaticky zhruba do minuty.
Zatím je web skrytý před vyhledávači (řádek `<meta name="robots" content="noindex, nofollow">` v `index.html`),
dostane se na něj jen ten, kdo má odkaz. Až má být k nalezení i přes Google, ten řádek smažte.
Jazyk se vybere podle prohlížeče, jde přepnout vpravo nahoře, odkaz na konkrétní jazyk: `?lang=cs` (`en`, `es`).

## Soubory
- `index.html` – obsah stránky; **anglické texty** jsou přímo tady
- `script.js` – **kontakty** (`CONFIG` hned nahoře), **české a španělské texty** (`T.cs`, `T.es`), galerie, formulář a kalendář
- `style.css` – vzhled (barvy a písma jsou nahoře v `:root`)
- `img/` – fotky pro web (zmenšené, bez GPS údajů); `favicon.svg` – ikonka
- `availability.json` – obsazené noci pro kalendář; **přepisuje ho GitHub sám**, ručně ho neměňte
- `tools/availability.py` – skript, který obsazenost načítá z obou kalendářů
- `tools/poptavky.gs` – Google skript, který z poptávkového formuláře pošle e-maily (viz níže)
- `.github/workflows/web.yml` – automatická úloha: každých 10 minut načte kalendáře a při změně web znovu zveřejní
- `PXL_*.jpg`, `Photos-1-001.zip` – zdrojové fotky z telefonu, do repozitáře ani na web se nenahrávají

## Jak funguje obsazenost
- Booking (rezervace i ručně zavřené dny) a Google kalendář „Přímé rezervace“ se každých 10 minut
  sloučí do `availability.json` a z něj kreslí kalendář na webu. Návštěvníci vidí jen obsazené dny, žádná jména.
- Google kalendář „Přímé rezervace“ je zároveň importovaný do Bookingu, takže přímá rezervace zavře termín i tam.
  Booking si ho ale načítá se zpožděním – v sezóně proto termín po potvrzení zavřete v Bookingu i ručně.
- Přímou rezervaci zapisujte jako **celodenní událost od dne příjezdu do posledního nocování** (den před odjezdem).
- Adresy obou kalendářů jsou uložené na GitHubu: *Settings → Secrets and variables → Actions* jako
  `BOOKING_ICAL` a `DIRECT_ICAL`. Když se změní (např. nová tajná adresa Google kalendáře), přepište je tam.
- Kalendář na webu je orientační, rezervaci vždy potvrzujete ručně.

## Poptávkový formulář a e-maily
- Host vyplní jméno, e-mail, termín, počet hostů a případně zprávu. Web údaje pošle Google skriptu,
  který odešle dva e-maily ze schránky benalmadena.clara@gmail.com: hostovi potvrzení, že poptávka dorazila
  a čeká na potvrzení (v jazyce webu), a nám poptávku se všemi údaji – odpovědí na ni píšete rovnou hostovi.
- Skript je nasazený od 4. 11. 2026 na https://script.google.com pod účtem benalmadena.clara@gmail.com,
  jeho adresa je v `script.js` jako `inquiryUrl`. Postup, kdyby se nasazoval znovu:
  1. https://script.google.com → *Nový projekt*, smazat ukázkový kód a vložit obsah `tools/poptavky.gs`, uložit.
  2. *Implementovat → Nová implementace* → ozubené kolečko → *Webová aplikace*; *Spustit jako: Já*,
     *Kdo má přístup: Kdokoli* (ne „Kdokoli s účtem Google“) → *Implementovat*.
  3. *Autorizovat přístup* → vybrat účet → „Google tuto aplikaci neověřil“ → *Rozšířené* → *Přejít na … (nebezpečné)* → *Povolit*
     (je to váš vlastní skript, upozornění Google ukazuje u všech neověřených skriptů).
  4. Zkopírovat *adresu webové aplikace* (končí na `/exec`) a vložit ji do `script.js` jako `inquiryUrl`.
- Po úpravě kódu skriptu: *Implementovat → Spravovat implementace* → tužka → *Verze: Nová verze* → *Implementovat*
  (adresa zůstane stejná). *Nová implementace* by vytvořila novou adresu a tu by bylo nutné přepsat v `script.js`.
- Kontrola, že skript běží: otevřít jeho adresu v prohlížeči – ukáže `{"ok":true,…}` a nic neodešle.
- Kdyby `inquiryUrl` byla prázdná, formulář jen otevře e-mailový program hosta s předvyplněnou zprávou.
- WhatsApp je na webu zatím skrytý (`whatsapp: ''` v `CONFIG`); zapne se vrácením čísla `420602166011`.

## Ceny
- Cena za noc (90 €) a minimální počet nocí (4) jsou v `script.js` v `CONFIG` (`nightlyEur`, `minNights`).
  Když změníte minimální pobyt, upravte i texty `price.detail` a `info.out.d`
  (anglicky v `index.html`, česky a španělsky v `script.js`).
- Česká verze ukazuje ceny v korunách: eura přepočítá denním kurzem ČNB (na celé koruny), který automatická
  úloha ukládá do `availability.json`. Angličtina a španělština ukazují eura.
- Kalendář po výběru termínu spočítá orientační cenu a vloží ji i do poptávky.

## Úprava textu
Každý text má klíč, např. `data-i18n="apt.text"`. Anglická verze je v `index.html`,
česká a španělská pod stejným klíčem v `script.js`. Při změně upravte všechny tři.

## Co ještě doplnit
1. Andaluské registrační číslo (VFT/MA/…), až bude – do patičky v `index.html` vedle CRU.
2. Fotky interiéru ve vyšším rozlišení: stačí přepsat soubory v `img/` (stejné názvy).
3. Hodnocení z Bookingu (9,0 / 38 recenzí a dílčí známky) je napsané natvrdo – občas aktualizovat
   v `index.html` (hledej `data-num`, `--v:` a „38“) a v `script.js` („38“, „9,3“).
