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
- `platba.html` – pomocná stránka jen pro nás: potvrzení rezervace s QR kódem pro platbu a jeho odeslání hostovi (viz níže)
- `script.js` – **kontakty** (`CONFIG` hned nahoře), **české a španělské texty** (`T.cs`, `T.es`), galerie, formulář a kalendář
- `style.css` – vzhled (barvy a písma jsou nahoře v `:root`)
- `img/` – fotky pro web (zmenšené, bez GPS údajů); `favicon.svg` – ikonka
- `availability.json` – záloha obsazenosti a kurz ČNB pro kalendář; **přepisuje ho GitHub sám**, ručně ho neměňte
- `tools/availability.py` – skript, který na GitHubu načítá zálohu obsazenosti z obou kalendářů a kurz ČNB
- `tools/poptavky.gs` – Google skript: z poptávkového formuláře pošle e-maily a webu vrací aktuální obsazenost (viz níže)
- `.github/workflows/web.yml` – automatická úloha: obnoví zálohu obsazenosti a kurz a při změně web znovu zveřejní
  (nastavená po 10 minutách, GitHub ji ale reálně pouští zhruba jednou za hodinu)
- `PXL_*.jpg`, `Photos-1-001.zip` – zdrojové fotky z telefonu, do repozitáře ani na web se nenahrávají

## Jak funguje obsazenost
- Kalendář na webu ukazuje obsazené noci z Bookingu (rezervace i ručně zavřené dny) a z Google kalendáře
  „Přímé rezervace“. Návštěvníci vidí jen obsazené dny, žádná jména.
- **Aktuální stav** si web při otevření stránky vyžádá od Google skriptu (`tools/poptavky.gs`), který oba kalendáře
  čte napřímo a pamatuje si je 5 minut – změny jsou tedy na webu do pár minut.
- **Záloha:** automatická úloha na GitHubu ukládá obsazenost a kurz ČNB do `availability.json`. Je nastavená
  na každých 10 minut, GitHub ji ale reálně pouští zhruba jednou za hodinu. Web zálohu ukáže hned a nahradí ji
  aktuálním stavem, jakmile Google skript odpoví (když neodpoví, zůstane záloha).
- Google kalendář „Přímé rezervace“ je zároveň importovaný do Bookingu, ten si ho ale stahuje se zpožděním
  (v našem testu asi 2 hodiny). Po potvrzení přímé rezervace proto termín **hned zavřete v Bookingu i ručně**
  (a když rezervace padne, zase ho tam ručně otevřete).
- Přímou rezervaci zapisujte jako **celodenní událost od dne příjezdu do posledního nocování** (den před odjezdem).
- Adresy obou kalendářů jsou uložené na dvou místech – když se změní (např. nová tajná adresa Google kalendáře),
  přepište je v obou:
  - na GitHubu: *Settings → Secrets and variables → Actions* jako `BOOKING_ICAL` a `DIRECT_ICAL`,
  - v Google skriptu: *Nastavení projektu* (ozubené kolečko vlevo) → *Vlastnosti skriptu*, pod stejnými názvy.
- Kalendář na webu je orientační, rezervaci vždy potvrzujete ručně – předtím se ještě podívejte do Bookingu.

## Poptávkový formulář a e-maily
- Host vyplní jméno, e-mail, termín, počet hostů a případně zprávu. Web údaje pošle Google skriptu,
  který ze schránky benalmadena.clara@gmail.com odešle:
  - hostovi potvrzení, že poptávka dorazila a čeká na potvrzení (v jazyce webu),
  - do benalmadena.clara@gmail.com poptávku se všemi údaji – odpovědí na ni píšete rovnou hostovi,
  - na osobní e-mail z vlastnosti skriptu `NOTIFY_EMAIL` krátké upozornění s postupem (odpověď na něj jde
    zpět do benalmadena.clara@gmail.com, ne hostovi; když je vlastnost prázdná, upozornění se neposílá).
- Hostům vždy odpovídejte z benalmadena.clara@gmail.com.
- Potvrzení hostovi může u některých schránek (např. Seznam) skončit ve spamu; web hosta po odeslání upozorní,
  ať se tam podívá.
- Skript je nasazený od 4. 11. 2026 na https://script.google.com pod účtem benalmadena.clara@gmail.com,
  jeho adresa je v `script.js` jako `inquiryUrl`. V *Nastavení projektu → Vlastnosti skriptu* má uložené
  `BOOKING_ICAL` a `DIRECT_ICAL` (adresy kalendářů) a `NOTIFY_EMAIL` (osobní e-mail pro upozornění) –
  nejsou v kódu, protože ten je na GitHubu veřejný. Postup, kdyby se nasazoval znovu:
  1. https://script.google.com → *Nový projekt*, smazat ukázkový kód a vložit obsah `tools/poptavky.gs`, uložit.
  2. *Nastavení projektu* (ozubené kolečko vlevo) → *Vlastnosti skriptu* → doplnit `BOOKING_ICAL`, `DIRECT_ICAL`
     a `NOTIFY_EMAIL` → uložit.
  3. Zpět v editoru vybrat funkci `testObsazenosti` → *Spustit* → povolit přístup: vybrat účet → „Google tuto
     aplikaci neověřil“ → *Rozšířené* → *Přejít na … (nebezpečné)* → *Povolit* (je to váš vlastní skript,
     upozornění Google ukazuje u všech neověřených skriptů). V protokolu se má objevit „V pořádku: …“.
  4. *Implementovat → Nová implementace* → ozubené kolečko → *Webová aplikace*; *Spustit jako: Já*,
     *Kdo má přístup: Kdokoli* (ne „Kdokoli s účtem Google“) → *Implementovat*.
  5. Zkopírovat *adresu webové aplikace* (končí na `/exec`) a vložit ji do `script.js` jako `inquiryUrl`.
- Po úpravě kódu skriptu: nejdřív v editoru jednou *Spustit* funkci `testObsazenosti` (kdyby si skript řekl
  o nové povolení, odsouhlasit), pak *Implementovat → Spravovat implementace* → tužka → *Verze: Nová verze* →
  *Implementovat* (adresa zůstane stejná). *Nová implementace* by vytvořila novou adresu a tu by bylo nutné
  přepsat v `script.js`.
- Kontrola, že skript běží: otevřít jeho adresu v prohlížeči – ukáže `{"ok":true,…}` a nic neodešle;
  s `?availability=1` na konci adresy ukáže obsazenost, kterou dostává web.
- Kdyby `inquiryUrl` byla prázdná, formulář jen otevře e-mailový program hosta s předvyplněnou zprávou.
- WhatsApp je na webu zatím skrytý (`whatsapp: ''` v `CONFIG`); zapne se vrácením čísla `420602166011`.

## Potvrzení rezervace a QR platba
- Stránka `platba.html` (jen pro nás – z webu na ni nevede odkaz a vyhledávače ji nezobrazí) připraví
  potvrzení v jazyce hosta: text, QR kód pro platbu a pod ním údaje pro ruční platbu. Odkaz na ni s údaji
  z poptávky přijde v obou e-mailech o poptávce (do benalmadena.clara@gmail.com i v upozornění na osobní e-mail).
- Postup: otevřít odkaz → případně upravit cenu, zálohu, splatnost nebo připsat poznámku → zkontrolovat náhled
  → *Odeslat hostovi*. E-mail pošle Google skript z benalmadena.clara@gmail.com a skrytou kopii nám;
  QR kód je v něm vložený jako obrázek, takže ho zobrazí i Gmail.
- Odeslat jde jen na adresu hosta z poptávky: odkaz nese podpis (token) k té adrese. Tajný klíč `LINK_SECRET`
  si skript sám uložil do vlastností skriptu – když ho smažete, přestanou platit odkazy ze starších poptávek.
- Ručně (stránka otevřená bez odkazu, nebo když chcete psát z Gmailu): *Kopírovat text* a vložit do e-mailu,
  pak *Kopírovat QR kód* a vložit ho do stejného e-mailu (v telefonu *Stáhnout QR kód* a přiložit).
  Gmail obrázek vložený zároveň s textem zahodí, proto se kopírují zvlášť.
- Kč: QR Platba (načte ji každá česká banka), v textu číslo účtu v českém tvaru a variabilní symbol
  = datum příjezdu (RRMMDD). Eura: evropský QR kód pro převod SEPA (umí ho jen část bank), v textu je proto
  i IBAN, BIC a zpráva pro příjemce.
- Účet se bere z vlastností Google skriptu: `PAYMENT_IBAN` (účet pro Kč), `PAYMENT_NAME` (majitel účtu),
  případně `PAYMENT_IBAN_EUR` (jiný účet pro eura) a `PAYMENT_BIC`. Stránku jde použít i ručně
  (https://benalmadenaclara.github.io/platba.html) – účet si pak pamatuje v daném prohlížeči.
- Text i QR kód se počítají v prohlížeči; ven jde jen hotový e-mail po kliknutí na *Odeslat hostovi*.
  Časy příjezdu a odjezdu a adresa jsou v textu napevno (`CHECKIN`, `CHECKOUT`, `ADDRESS` na začátku skriptu
  v `platba.html`). Adresa Google skriptu je tam jako `SCRIPT_URL` – když se změní, přepište ji i v `script.js`.

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
