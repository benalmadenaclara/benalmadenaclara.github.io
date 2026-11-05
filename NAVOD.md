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
- `rezervace.html` – stránka jen pro nás: přehled rezervací, konverzace s hostem, potvrzení s QR kódem a platba (viz níže)
- `script.js` – **kontakty** (`CONFIG` hned nahoře), **české a španělské texty** (`T.cs`, `T.es`), galerie, formulář a kalendář
- `style.css` – vzhled (barvy a písma jsou nahoře v `:root`)
- `img/` – fotky pro web (zmenšené, bez GPS údajů); `favicon.svg` – ikonka
- `availability.json` – záloha obsazenosti a kurz ČNB pro kalendář; **přepisuje ho GitHub sám**, ručně ho neměňte
- `tools/availability.py` – skript, který na GitHubu načítá zálohu obsazenosti z obou kalendářů a kurz ČNB
- `tools/poptavky.gs` – Google skript: poptávky, rezervace, e-maily hostům, hlídání zpráv a plateb a aktuální obsazenost (viz níže)
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

## Poptávky a rezervace (jak to obsluhovat)
- Host vyplní na webu formulář (jméno, e-mail, termín, počet hostů, případně zprávu). Google skript poptávku
  uloží jako rezervaci a ze schránky benalmadena.clara@gmail.com pošle:
  - hostovi jen „poptávka dorazila, čeká na potvrzení“ (v jazyce webu, bez platebních údajů),
  - do benalmadena.clara@gmail.com a na osobní e-mail (`NOTIFY_EMAIL`) upozornění s **odkazem na rezervaci**.
- **Stránka rezervace** (`rezervace.html`, otevírá se odkazem z e-mailu):
  - nahoře stav: nová poptávka / potvrzeno – čeká na platbu / zaplaceno ✓ / zrušeno,
  - **konverzace s hostem** – zpráva z formuláře a e-maily s hostem k této rezervaci (skript je čte ze schránky;
    jen od poptávky do případné další poptávky téhož hosta, bez interních upozornění pro nás),
  - **Odpovědět hostovi** – odpověď odejde z benalmadena.clara@gmail.com (když host už psal, jako odpověď v jeho vlákně),
  - **Potvrdit a poslat platební údaje** – e-mail v jazyce hosta: text, QR kód pro platbu a pod ním údaje pro ruční
    platbu; termín, cenu, zálohu a splatnost jde upravit a náhled ukazuje přesně to, co host dostane,
  - **Platba přišla** – host dostane poděkování (text jde upravit, nebo jen označit platbu bez e-mailu),
    u rezervace se objeví fajfka ✓ a připomínky přestanou chodit,
  - dole *Zrušit rezervaci* (hostovi se nic neposílá) a *Obnovit rezervaci*; zrušenou jde *Smazat natrvalo*
    (třeba zkušební – e-maily v Gmailu zůstanou),
  - nahoře *← Všechny rezervace* – přechod na přehled a ostatní hosty.
- **Přehled všech rezervací** – odkaz přijde e-mailem po spuštění funkce `nastavit` a je i v každém upozornění
  na osobní e-mail. Rezervace jsou rozdělené na nové, čekající na platbu, zaplacené a proběhlé/zrušené;
  značka „nová zpráva“ znamená, že host napsal a zprávu zatím nikdo neotevřel.
- **Upozornění na osobní e-mail** (`NOTIFY_EMAIL`): nová poptávka, každá nová zpráva od hosta (kontrola
  každých 10 minut) a připomínka platby 1, 3 a 7 dní po potvrzení, dokud nikdo neklikne na *Platba přišla*.
- Po potvrzení **hned zavřete termín v Bookingu** a zapište pobyt do Google kalendáře „Přímé rezervace“.
- Odkazy v našich e-mailech jsou podepsané a otevřou rezervaci i přehled všech ostatních. **Nikomu je
  nepřeposílejte** – proto e-mail s poptávkou není „odpovědí hostovi“, hostům se píše ze stránky.
  Starší odkazy na jednu rezervaci (`#id=…&t=…`) platí dál; na přehled z nich vede cesta, když byl v tom
  prohlížeči někdy otevřený odkaz na přehled.
- Potvrzení hostovi může u některých schránek (např. Seznam) skončit ve spamu; web hosta po odeslání formuláře
  upozorní, ať se tam podívá.
- Platby: Kč = QR Platba (načte ji každá česká banka), v textu číslo účtu v českém tvaru a variabilní symbol
  = datum příjezdu (RRMMDD). Eura = evropský QR kód pro převod SEPA (umí ho jen část bank), proto jsou pod ním
  i IBAN, BIC a zpráva pro příjemce. Časy příjezdu a odjezdu a adresa jsou v textech napevno
  (`CHECKIN`, `CHECKOUT`, `ADDRESS` na začátku skriptu v `rezervace.html`).
- Rezervace se mažou automaticky rok po odjezdu.

## Google skript (tools/poptavky.gs)
- Běží na https://script.google.com pod účtem benalmadena.clara@gmail.com (od 4. 11. 2026); jeho adresa
  (končí na `/exec`) je v `script.js` jako `inquiryUrl` a v `rezervace.html` jako `SCRIPT_URL`.
- Má přístup ke Gmailu té schránky (čte konverzace s hosty a posílá e-maily) a dva spouštěče: každých 10 minut
  kontrola nových zpráv a denně v 9:00 připomínky plateb a mazání starých rezervací (vytvoří je funkce `nastavit`).
- *Nastavení projektu → Vlastnosti skriptu* (tajné a osobní údaje mimo veřejný kód):
  `BOOKING_ICAL`, `DIRECT_ICAL` (adresy kalendářů), `NOTIFY_EMAIL` (osobní e-mail pro upozornění),
  `PAYMENT_IBAN` (účet pro Kč), `PAYMENT_NAME` (majitel účtu), nepovinně `PAYMENT_IBAN_EUR` a `PAYMENT_BIC`.
  Skript si tam sám ukládá rezervace (`b_…`), `LINK_SECRET` (klíč k podpisu odkazů – když ho smažete,
  přestanou platit všechny dosavadní odkazy) a `MAIL_CHECKED`.
- **Po úpravě kódu:** vložit nový kód → uložit → vybrat funkci `nastavit` → *Spustit* (odsouhlasit případná
  nová povolení; pošle znovu odkaz na přehled) → *Implementovat → Spravovat implementace* → tužka →
  *Verze: Nová verze* → *Implementovat*. Adresa zůstane stejná; *Nová implementace* by vytvořila novou
  a tu by bylo nutné přepsat v `script.js` i `rezervace.html`.
- Nasazení od nuly: *Nový projekt* → vložit kód → doplnit vlastnosti → *Spustit* `nastavit` a povolit přístup
  („Google tuto aplikaci neověřil“ → *Rozšířené* → *Přejít na … (nebezpečné)* → *Povolit* – je to váš vlastní
  skript) → *Implementovat → Nová implementace* → *Webová aplikace*, *Spustit jako: Já*, *Kdo má přístup: Kdokoli*
  (ne „Kdokoli s účtem Google“) → adresu vložit do `script.js` a `rezervace.html`.
- Kontrola, že skript běží: otevřít jeho adresu v prohlížeči – ukáže `{"ok":true,…}` a nic neodešle;
  s `?availability=1` na konci ukáže obsazenost, kterou dostává web. Funkce `testObsazenosti` v editoru
  zkontroluje kalendáře.
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
