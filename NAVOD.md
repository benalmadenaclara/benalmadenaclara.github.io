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
- `.github/workflows/web.yml` – automatická úloha: každou půlhodinu načte kalendáře a při změně web znovu zveřejní
- `PXL_*.jpg`, `Photos-1-001.zip` – zdrojové fotky z telefonu, do repozitáře ani na web se nenahrávají

## Jak funguje obsazenost
- Booking (rezervace i ručně zavřené dny) a Google kalendář „Přímé rezervace“ se každou půlhodinu
  sloučí do `availability.json` a z něj kreslí kalendář na webu. Návštěvníci vidí jen obsazené dny, žádná jména.
- Google kalendář „Přímé rezervace“ je zároveň importovaný do Bookingu, takže přímá rezervace zavře termín i tam.
  Booking si ho ale načítá se zpožděním – v sezóně proto termín po potvrzení zavřete v Bookingu i ručně.
- Přímou rezervaci zapisujte jako **celodenní událost od dne příjezdu do posledního nocování** (den před odjezdem).
- Adresy obou kalendářů jsou uložené na GitHubu: *Settings → Secrets and variables → Actions* jako
  `BOOKING_ICAL` a `DIRECT_ICAL`. Když se změní (např. nová tajná adresa Google kalendáře), přepište je tam.
- Kalendář na webu je orientační, rezervaci vždy potvrzujete ručně.

## Úprava textu
Každý text má klíč, např. `data-i18n="apt.text"`. Anglická verze je v `index.html`,
česká a španělská pod stejným klíčem v `script.js`. Při změně upravte všechny tři.

## Co ještě doplnit
1. Andaluské registrační číslo (VFT/MA/…), až bude – do patičky v `index.html` vedle CRU.
2. Fotky interiéru ve vyšším rozlišení: stačí přepsat soubory v `img/` (stejné názvy).
3. Hodnocení z Bookingu (9,0 / 38 recenzí a dílčí známky) je napsané natvrdo – občas aktualizovat
   v `index.html` (hledej `data-num`, `--v:` a „38“) a v `script.js` („38“, „9,3“).
