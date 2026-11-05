/* Apartment Clara – přepínání jazyků, galerie a poptávkový formulář */

// ===== KONTAKTY (prázdný text = položka se na webu skryje) =====
const CONFIG = {
  whatsapp: '',               // WhatsApp zatím skrytý; zapne se vrácením čísla '420602166011'
  phone: '+420 602 166 011',  // telefon tak, jak se má zobrazit
  email: 'benalmadena.clara@gmail.com',
  // adresa Google skriptu (tools/poptavky.gs): pošle potvrzení hostovi a poptávku nám a vrací aktuální obsazenost;
  // dokud je prázdná, formulář jen otevře e-mail hosta s předvyplněnou zprávou a kalendář bere jen availability.json
  inquiryUrl: 'https://script.google.com/macros/s/AKfycbzMx1uGy9Y-dQa4ctcGOAseiWcZucwigxKmiCQ85OamDg6GvSkUjsPRs60go9ph4cjZpA/exec',
  nightlyEur: 90,             // cena za noc v eurech (česká verze ji přepočítá kurzem ČNB)
  minNights: 4,               // minimální počet nocí (zmínka je i v textech price.detail a info.out.d)
};

const BOOKING_URL = 'https://www.booking.com/hotel/es/apartment-clara';
const BOOKING_LANG = { cs: 'cs', en: 'en-gb', es: 'es' };
const LOCALE = { cs: 'cs-CZ', en: 'en-GB', es: 'es-ES' };
const LANGS = Object.keys(LOCALE);
const ATTRS = ['alt', 'content', 'placeholder', 'title', 'aria-label'];

// Anglické texty jsou přímo v index.html. Tady jsou české a španělské překlady
// (klíče odpovídají atributům data-i18n…) a texty, které skládá až skript.
const T = {
  en: {
    'form.errDates': 'Departure must be after arrival.',
    'form.errName': 'Please fill in your name.',
    'form.errEmail': 'Please enter a valid e-mail address.',
    'form.errNoDates': 'Please choose your arrival and departure dates.',
    'form.sending': 'Sending…',
    'form.done': "Thank you! We've received your request and will get back to you soon. We've e-mailed you a confirmation – if you can't see it, please check your spam folder and mark it as “not spam” so that our reply reaches you too.",
    'form.failed': "The request couldn't be sent. Please try again or write to us at {email}.",
    'msg.intro': 'Hello, we would like to book Apartment Clara directly with you.',
    'msg.name': 'Name',
    'msg.from': 'Arrival',
    'msg.to': 'Departure',
    'msg.guests': 'Guests',
    'msg.subject': 'Booking request – Apartment Clara',
    'cal.hint': 'Click your arrival day, then your departure day.',
    'cal.pickDeparture': 'Now click your departure day.',
    'cal.loading': 'Loading availability…',
    'cal.error': "We couldn't load the availability right now. Send us your dates and we'll check for you.",
    'cal.stale': 'Availability last updated on {date}. We always confirm your dates.',
    'cal.conflict': 'The selected dates overlap with booked days – please pick other dates or write to us.',
    'cal.nights': { one: 'night', other: 'nights' },
    'cal.minStay': 'Minimum stay: {nights}.',
    'cal.noRoom': "A minimum stay ({nights}) doesn't fit from this day – please choose another arrival day.",
    'price.perNight': '{price} / night',
    'price.note': 'Converted from {eur} at the Czech National Bank rate of {rate} CZK/€ ({date}).',
    'msg.price': 'Estimated price',
  },

  cs: {
    'meta.title': 'Apartment Clara · Benalmádena – apartmán s bazénem 400 m od pláže',
    'meta.desc': 'Světlý apartmán 70 m² v 8. patře s balkonem s výhledem na bazén, zahradu a moře. 2 ložnice, až 4 hosté, 400 m od pláže v Benalmádeně na Costa del Sol. Domluvíte se česky.',
    'a11y.skip': 'Přeskočit na obsah',
    'nav.label': 'Hlavní navigace',
    'nav.apartment': 'Apartmán',
    'nav.gallery': 'Galerie',
    'nav.location': 'Poloha',
    'nav.reviews': 'Hodnocení',
    'nav.info': 'Info',
    'nav.contact': 'Rezervace',
    'nav.menu': 'Menu',
    'lang.label': 'Jazyk',
    'cta.bookShort': 'Rezervovat',
    'cta.book': 'Rezervovat na Booking.com',
    'cta.direct': 'Rezervovat napřímo',
    'cta.onBooking': 'Na Booking.com',

    'hero.eyebrow': 'Benalmádena · Costa del Sol · Španělsko',
    'hero.lead': 'Světlý apartmán v 8. patře s balkonem s výhledem na bazén, zahradu a moře – na pláž to máte jen 400 metrů.',
    'fact.bedrooms': '2 ložnice',
    'fact.guests': 'Až 4 hosté',
    'fact.pool': 'Bazén a zahrada',
    'hero.czech': 'Jsme Češi – se vším vám rádi poradíme česky',
    'hero.rating': '38 hodnocení na Booking.com',
    'alt.heroMain': 'Výhled z balkonu na bazén, zahradu a moře',
    'alt.heroInset': 'Balkon se stolkem a výhledem na bazén',

    'hl.label': 'Hlavní přednosti',
    'hl.beach.t': '400 m od pláže',
    'hl.beach.d': 'Na pláž Playa de Santa Ana dojdete asi za 5 minut.',
    'hl.pool.t': 'Bazén a zahrada',
    'hl.pool.d': 'Velký bazén v areálu (od poloviny června do konce září) a dětské hřiště.',
    'hl.view.t': 'Výhled z 8. patra',
    'hl.view.d': 'Z balkonu uvidíte bazén, zahradu, moře i hory.',
    'hl.comfort.t': 'Klimatizace a Wi-Fi',
    'hl.comfort.d': 'Wi-Fi zdarma a velká Smart TV.',

    'apt.eyebrow': 'Apartmán',
    'apt.title': 'Místo pro čtyři a vše pro pohodovou dovolenou',
    'apt.text': 'Apartmán Clara má 70 m² a najdete ho v 8., předposledním patře domu s výtahem. Čeká na vás prostorný obývací pokoj s kuchyní a jídelním stolem, dvě samostatné ložnice, koupelna se sprchovým koutem a balkon, kde si můžete dát snídani s výhledem. Ložní prádlo, ručníky i toaletní potřeby jsou samozřejmostí.',
    'room.living.t': 'Obývací pokoj s kuchyní',
    'room.living.d': 'Dvě pohovky, jídelní stůl pro čtyři a Smart TV',
    'room.bed.t': 'Dvě ložnice',
    'room.bed.d': 'Jedna manželská a jedna velká manželská postel',
    'room.bath.t': 'Koupelna',
    'room.bath.d': 'Sprchový kout, ručníky a toaletní potřeby',
    'room.balcony.t': 'Balkon',
    'room.balcony.d': 'Stolek a židle s výhledem na bazén a moře',
    'amen.title': 'Vybavení',
    'amen.ac': 'Klimatizace',
    'amen.wifi': 'Wi-Fi zdarma',
    'amen.tv': 'Velká Smart TV',
    'amen.kitchen': 'Plně vybavená kuchyň',
    'amen.oven': 'Trouba, varná deska a mikrovlnka',
    'amen.fridge': 'Lednice',
    'amen.airfryer': 'Horkovzdušná fritéza',
    'amen.coffee': 'Kávovar, konvice a toustovač',
    'amen.washer': 'Pračka',
    'amen.linen': 'Ložní prádlo a ručníky',
    'amen.cot': 'Dětská postýlka zdarma',
    'amen.balcony': 'Balkon s posezením',
    'amen.lift': 'Výtah',
    'amen.selfcheckin': 'Self check-in',
    'amen.pool': 'Sezónní venkovní bazén',
    'amen.playground': 'Dětské hřiště',

    'gal.eyebrow': 'Galerie',
    'gal.title': 'Podívejte se dovnitř',
    'gal.view': 'Výhled z balkonu: bazén, zahrada a moře',
    'gal.1': 'Obývací pokoj se dvěma pohovkami a jídelním stolem',
    'gal.2': 'Propojená kuchyň, jídelna a obývací pokoj',
    'gal.3': 'Balkon s výhledem na bazén a moře',
    'gal.4': 'Kuchyň s troubou, varnou deskou a pračkou',
    'gal.5': 'Kávovar, horkovzdušná fritéza, konvice a toustovač',
    'gal.6': 'Ložnice s manželskou postelí',
    'gal.7': 'Druhá ložnice s oknem na balkon',
    'gal.8': 'Koupelna se sprchovým koutem',
    'gal.9': 'Umyvadlo v koupelně',
    'gal.10': 'Pohled z apartmánu na bazén a zahradu',
    'gal.11': 'Bazén v areálu',
    'gal.12': 'Večerní výhled z balkonu',

    'hosts.eyebrow': 'Kdo jsme',
    'hosts.title': 'Jsme Češi a rádi vám pomůžeme',
    'hosts.text': 'O apartmán Clara se staráme osobně. Domluvíte se s námi česky, anglicky i španělsky – před cestou i během celého pobytu. Rádi poradíme, jak se dostat z letiště, doporučíme pláže, restaurace i výlety, a kdybyste cokoliv potřebovali, stačí nám napsat.',
    'hosts.p1': 'Pomoc před cestou – doprava, příjezd, tipy',
    'hosts.p2': 'Během pobytu jsme vám k dispozici',
    'hosts.p3': 'Místní tipy na pláže, restaurace a výlety',
    'hosts.p4': 'Po předchozí domluvě vám klíče předáme už v Praze',
    'alt.palms': 'Palmová alej v parku v Benalmádeně',

    'loc.eyebrow': 'Poloha',
    'loc.title': 'Kousek od pláže, vše potřebné po ruce',
    'loc.text': 'Apartmán najdete v rezidenčním areálu se zahradou v Benalmádeně Costa – hosté hodnotí polohu známkou 9,3 z 10. Restaurace, bary i obchody máte hned za rohem a na pobřežní promenádu dojdete za pár minut.',
    'dist.train': 'Vlaková stanice Benalmádena–Arroyo de la Miel',
    'dist.airport': 'Letiště Málaga',
    'dist.airport.v': '≈ 15 min autem',
    'dist.malaga': 'Centrum Málagy',
    'dist.malaga.v': '≈ 30 min vlakem',
    'alt.road': 'Ulice vedoucí od apartmánu dolů k moři',
    'loc.photo': 'Cesta k moři – asi 5 minut pěšky',
    'loc.mapTitle': 'Mapa – poloha apartmánu Clara',
    'loc.gmaps': 'Otevřít v Google Maps',

    'ex.eyebrow': 'Tipy na výlety',
    'ex.title': 'Naše oblíbená místa v okolí',
    'ex.text': 'Benalmádena je krásná po celý rok – i v zimě bývá přes den kolem 17 °C.',
    'alt.beach': 'Pláž v létě s nafukovacím aquaparkem',
    'ex.beach.t': 'Pláže',
    'ex.beach.d': 'Nejbližší pláž Playa de Santa Ana je jen 400 m od apartmánu a podél pobřeží najdete řadu dalších.',
    'alt.prom': 'Pobřežní promenáda s lampiony a palmami',
    'ex.prom.t': 'Pobřežní promenáda',
    'ex.prom.d': 'Plážové bary, kavárny a dlouhá procházka podél moře až do Torremolinos.',
    'alt.marina': 'Jachty a bílé domy v přístavu Puerto Marina',
    'ex.marina.t': 'Přístav Puerto Marina',
    'ex.marina.d': 'Jachetní přístav s restauracemi a bary, akváriem Sea Life a výlety lodí.',
    'alt.paloma': 'Trávníky a palmy v parku Paloma, v pozadí hory',
    'ex.paloma.d': 'Velký park s jezírkem, volně pobíhajícími zvířátky a hřišti – ideální pro děti.',
    'ex.colomares.d': 'Pohádková stavba věnovaná Kryštofu Kolumbovi na kopci nad pobřežím.',
    'alt.stupa': 'Buddhistická stúpa nad Benalmádenou',
    'ex.pueblo.t': 'Benalmádena Pueblo a stúpa',
    'ex.pueblo.d': 'Bílá andaluská vesnička nad pobřežím a buddhistická stúpa s výhledem na celé pobřeží.',
    'ex.more': 'Další tipy',
    'ex.tip.cable': '<strong>Lanovka</strong> na horu Calamorro – výhled na celé pobřeží.',
    'ex.tip.malaga': '<strong>Málaga</strong> – asi 30 minut vlakem: pevnost Alcazaba, katedrála a Picassovo muzeum.',
    'ex.tip.bonanza': '<strong>Náš tip na večer:</strong> Plaza Bonanza s řadou restaurací a barů.',
    'ex.tip.trips': '<strong>Výlety autem:</strong> Mijas (25 min), Marbella (35 min), Nerja (1 h), Caminito del Rey (1 h), Ronda (1,5 h), Granada (1 h 45 min).',

    'rev.eyebrow': 'Hodnocení hostů',
    'rev.count': '38 hodnocení na Booking.com',
    'rev.link': 'Přečíst recenze na Booking.com',
    'rev.title': 'Hosté chválí polohu i výhled',
    'rev.text': 'Hosté nejčastěji vyzdvihují polohu kousek od pláže, čistotu, výhled z balkonu, dobře vybavenou kuchyň a rychlou a vstřícnou komunikaci.',
    'rev.c.location': 'Lokalita',
    'rev.c.comfort': 'Pohodlí',
    'rev.c.staff': 'Personál',
    'rev.c.clean': 'Čistota',
    'rev.c.value': 'Poměr ceny a kvality',
    'rev.c.facilities': 'Vybavení',

    'info.eyebrow': 'Praktické informace',
    'info.title': 'Než přijedete',
    'info.in.t': 'Příjezd',
    'info.in.d': 'Od 15:00. Díky self check-inu můžete přijet i později, bez příplatku – jen nám prosím dejte vědět, kdy dorazíte.',
    'info.out.t': 'Odjezd a délka pobytu',
    'info.out.d': 'Odjezd do 10:00. Minimální délka pobytu jsou 4 noci.',
    'info.guests.t': 'Počet hostů',
    'info.guests.d': 'Maximálně 4 osoby. Přistýlky nejsou k dispozici.',
    'info.kids.t': 'Děti',
    'info.kids.d': 'Děti všech věků jsou vítány. Dětská postýlka (0–3 roky) zdarma na vyžádání.',
    'info.pool.t': 'Bazén',
    'info.pool.d': 'Venkovní bazén v zahradě areálu je otevřený od poloviny června do konce září.',
    'info.lift.t': 'Výtah',
    'info.lift.d': 'Apartmán je v 8., předposledním patře a dům má výtah.',
    'info.parking.t': 'Parkování',
    'info.parking.d': 'K apartmánu nepatří parkovací místo.',
    'info.rules.t': 'Pravidla',
    'info.rules.d': 'Nekuřácký apartmán. Bez domácích zvířat, večírků a rozlučkových oslav.',
    'info.airport.t': 'Z letiště',
    'info.airport.d': 'Taxíkem asi 15 minut, nebo vlakem C1 do stanice Benalmádena–Arroyo de la Miel (cca 15 min) a odtud 1,4 km.',

    'contact.eyebrow': 'Rezervace a kontakt',
    'contact.title': 'Rezervujte si pobyt přímo u nás',
    'contact.text': 'Pošlete nám termín a počet hostů – ověříme volno a ozveme se s cenou a podmínkami. Rezervovat můžete i přes Booking.com.',
    'direct.title': 'Proč rezervovat napřímo',
    'direct.p1': 'Domluvíte se přímo s námi – česky, anglicky i španělsky',
    'direct.p2': 'Předání klíčů domluvíme podle vás – klidně už v Praze',
    'direct.p3': 'Poradíme s cestou i s tipy na místě',
    'book.title': 'Raději přes Booking.com?',
    'book.text': 'Volné termíny a ceny najdete i na Booking.com, kde si pobyt můžete rovnou zarezervovat.',
    'contact.direct': 'Přímý kontakt',
    'form.title': 'Poptávka rezervace',
    'form.intro': 'Vyberte termín v kalendáři, vyplňte jméno a e-mail a pošlete nám poptávku. Na e-mail vám přijde potvrzení, že dorazila; odpovíme česky, anglicky i španělsky.',
    'form.email': 'E-mail',
    'form.send': 'Odeslat poptávku',
    'form.errName': 'Vyplňte prosím jméno.',
    'form.errEmail': 'Zadejte prosím platný e-mail.',
    'form.errNoDates': 'Vyberte prosím termín příjezdu a odjezdu.',
    'form.sending': 'Odesílám…',
    'form.done': 'Děkujeme! Poptávku jsme přijali a brzy se vám ozveme. Potvrzení jsme vám poslali e-mailem – pokud ho nevidíte, podívejte se prosím do spamu a označte ho jako „není spam“, ať k vám dorazí i naše odpověď.',
    'form.failed': 'Poptávku se nepodařilo odeslat. Zkuste to prosím znovu, nebo nám napište na {email}.',
    'cal.title': 'Volné termíny',
    'cal.prev': 'Předchozí měsíc',
    'cal.next': 'Další měsíc',
    'cal.free': 'Volno',
    'cal.busy': 'Obsazeno',
    'cal.stay': 'Váš pobyt',
    'cal.hint': 'Klikněte na den příjezdu a potom na den odjezdu.',
    'cal.pickDeparture': 'Teď klikněte na den odjezdu.',
    'cal.loading': 'Načítám obsazenost…',
    'cal.error': 'Obsazenost se teď nepodařilo načíst. Napište nám termín a volno ověříme.',
    'cal.stale': 'Obsazenost naposledy aktualizována {date}. Termín vždy potvrdíme.',
    'cal.conflict': 'Vybraný termín zasahuje do obsazených dnů – zkuste prosím jiný, nebo nám napište.',
    'cal.nights': { one: 'noc', few: 'noci', many: 'noci', other: 'nocí' },
    'cal.minStay': 'Minimální délka pobytu: {nights}.',
    'cal.noRoom': 'Z tohoto dne se nevejde minimální pobyt ({nights}) – vyberte jiný den příjezdu.',
    'price.title': 'Cena při přímé rezervaci',
    'price.unit': 'za noc',
    'price.detail': 'Za celý apartmán (až 4 hosté), včetně ložního prádla a ručníků. Minimální pobyt 4 noci.',
    'price.perNight': '{price} / noc',
    'price.note': 'Přepočteno z {eur} kurzem ČNB {rate} Kč/€ ze dne {date}.',
    'msg.price': 'Orientační cena',
    'form.name': 'Jméno',
    'form.from': 'Příjezd',
    'form.to': 'Odjezd',
    'form.guests': 'Hosté',
    'form.msg': 'Zpráva (nepovinné)',
    'form.msgPh': 'Dobrý den, chtěli bychom se zeptat…',
    'form.note': 'Poptávka je nezávazná, rezervace platí až po našem potvrzení. Vaše údaje použijeme jen k vyřízení poptávky.',
    'form.errDates': 'Odjezd musí být až po příjezdu.',
    'msg.intro': 'Dobrý den, chtěli bychom si u vás napřímo zarezervovat apartmán Clara.',
    'msg.name': 'Jméno',
    'msg.from': 'Příjezd',
    'msg.to': 'Odjezd',
    'msg.guests': 'Počet hostů',
    'msg.subject': 'Rezervace – Apartment Clara',

    'footer.tag': 'Světlý apartmán s výhledem 400 m od pláže v Benalmádeně.',
    'footer.country': 'Španělsko',
    'footer.reg': 'Registrační číslo',
    'footer.speak': 'Mluvíme',
    'lb.close': 'Zavřít',
    'lb.prev': 'Předchozí fotka',
    'lb.next': 'Další fotka',
  },

  es: {
    'meta.title': 'Apartment Clara · Benalmádena – apartamento con piscina a 400 m de la playa',
    'meta.desc': 'Luminoso apartamento de 70 m² en la 8.ª planta con balcón y vistas a la piscina, el jardín y el mar. 2 dormitorios, hasta 4 huéspedes, a 400 m de la playa en Benalmádena, Costa del Sol.',
    'a11y.skip': 'Saltar al contenido',
    'nav.label': 'Navegación principal',
    'nav.apartment': 'Apartamento',
    'nav.gallery': 'Galería',
    'nav.location': 'Ubicación',
    'nav.reviews': 'Opiniones',
    'nav.info': 'Info',
    'nav.contact': 'Reservas',
    'nav.menu': 'Menú',
    'lang.label': 'Idioma',
    'cta.bookShort': 'Reservar',
    'cta.book': 'Reservar en Booking.com',
    'cta.direct': 'Reservar directamente',
    'cta.onBooking': 'En Booking.com',

    'hero.eyebrow': 'Benalmádena · Costa del Sol · España',
    'hero.lead': 'Un luminoso apartamento en la 8.ª planta con balcón y vistas a la piscina, el jardín y el mar, a solo 400 m de la playa.',
    'fact.bedrooms': '2 dormitorios',
    'fact.guests': 'Hasta 4 huéspedes',
    'fact.pool': 'Piscina y jardín',
    'hero.czech': 'Anfitriones checos: te ayudamos en español, inglés y checo',
    'hero.rating': '38 opiniones en Booking.com',
    'alt.heroMain': 'Vistas desde el balcón a la piscina, el jardín y el mar',
    'alt.heroInset': 'Balcón con mesa y vistas a la piscina',

    'hl.label': 'Lo más destacado',
    'hl.beach.t': 'A 400 m de la playa',
    'hl.beach.d': 'La playa de Santa Ana está a unos 5 minutos a pie.',
    'hl.pool.t': 'Piscina y jardín',
    'hl.pool.d': 'Gran piscina en el complejo (de mediados de junio a finales de septiembre) y parque infantil.',
    'hl.view.t': 'Vistas desde la 8.ª planta',
    'hl.view.d': 'Piscina, jardín, mar y montaña desde tu balcón.',
    'hl.comfort.t': 'Aire acondicionado y wifi',
    'hl.comfort.d': 'Wifi gratis y una Smart TV grande.',

    'apt.eyebrow': 'El apartamento',
    'apt.title': 'Espacio para cuatro y todo para unas vacaciones tranquilas',
    'apt.text': 'Apartment Clara tiene 70 m² y está en la 8.ª planta, la penúltima, de un edificio con ascensor. Cuenta con un amplio salón con cocina y mesa de comedor, dos dormitorios independientes, un baño con plato de ducha y un balcón donde desayunar con vistas. Ropa de cama, toallas y artículos de aseo incluidos.',
    'room.living.t': 'Salón con cocina',
    'room.living.d': 'Dos sofás, mesa de comedor para cuatro y Smart TV',
    'room.bed.t': 'Dos dormitorios',
    'room.bed.d': 'Una cama doble y una cama doble grande',
    'room.bath.t': 'Baño',
    'room.bath.d': 'Plato de ducha, toallas y artículos de aseo',
    'room.balcony.t': 'Balcón',
    'room.balcony.d': 'Mesa y sillas con vistas a la piscina y al mar',
    'amen.title': 'Equipamiento',
    'amen.ac': 'Aire acondicionado',
    'amen.wifi': 'Wifi gratis',
    'amen.tv': 'Smart TV grande',
    'amen.kitchen': 'Cocina totalmente equipada',
    'amen.oven': 'Horno, placa y microondas',
    'amen.fridge': 'Frigorífico',
    'amen.airfryer': 'Freidora de aire',
    'amen.coffee': 'Cafetera, hervidor y tostadora',
    'amen.washer': 'Lavadora',
    'amen.linen': 'Ropa de cama y toallas',
    'amen.cot': 'Cuna gratis bajo petición',
    'amen.balcony': 'Balcón con mesa y sillas',
    'amen.lift': 'Ascensor',
    'amen.selfcheckin': 'Check-in autónomo',
    'amen.pool': 'Piscina exterior de temporada',
    'amen.playground': 'Parque infantil',

    'gal.eyebrow': 'Galería',
    'gal.title': 'Echa un vistazo',
    'gal.view': 'Vistas desde el balcón: piscina, jardín y mar',
    'gal.1': 'Salón con dos sofás y mesa de comedor',
    'gal.2': 'Cocina, comedor y salón en un espacio abierto',
    'gal.3': 'Balcón con vistas a la piscina y al mar',
    'gal.4': 'Cocina con horno, placa y lavadora',
    'gal.5': 'Cafetera, freidora de aire, hervidor y tostadora',
    'gal.6': 'Dormitorio con cama doble',
    'gal.7': 'Segundo dormitorio con ventana al balcón',
    'gal.8': 'Baño con plato de ducha',
    'gal.9': 'Lavabo del baño',
    'gal.10': 'Vista de la piscina y el jardín desde el apartamento',
    'gal.11': 'Piscina del complejo',
    'gal.12': 'Vista nocturna desde el balcón',

    'hosts.eyebrow': 'Tus anfitriones',
    'hosts.title': 'Atención personal de anfitriones checos',
    'hosts.text': 'Cuidamos personalmente de Apartment Clara. Puedes hablar con nosotros en español, inglés o checo, antes del viaje y durante toda tu estancia. Te ayudamos a llegar desde el aeropuerto, te recomendamos playas, restaurantes y excursiones, y si necesitas cualquier cosa, basta con escribirnos.',
    'hosts.p1': 'Ayuda antes del viaje: transporte, llegada, consejos',
    'hosts.p2': 'Estamos disponibles durante toda tu estancia',
    'hosts.p3': 'Recomendaciones locales de playas, restaurantes y excursiones',
    'hosts.p4': 'Previo acuerdo, podemos entregarte las llaves en Praga',
    'alt.palms': 'Paseo de palmeras en un parque de Benalmádena',

    'loc.eyebrow': 'Ubicación',
    'loc.title': 'Cerca de la playa y de todo lo que necesitas',
    'loc.text': 'El apartamento está en un complejo residencial con jardín en Benalmádena Costa; los huéspedes valoran la ubicación con un 9,3 sobre 10. Restaurantes, bares y tiendas a la vuelta de la esquina, y el paseo marítimo a pocos minutos a pie.',
    'dist.train': 'Estación de tren Benalmádena–Arroyo de la Miel',
    'dist.airport': 'Aeropuerto de Málaga',
    'dist.airport.v': '≈ 15 min en coche',
    'dist.malaga': 'Centro de Málaga',
    'dist.malaga.v': '≈ 30 min en tren',
    'alt.road': 'Calle que baja desde el apartamento hacia el mar',
    'loc.photo': 'Camino al mar: unos 5 minutos a pie',
    'loc.mapTitle': 'Mapa: ubicación de Apartment Clara',
    'loc.gmaps': 'Abrir en Google Maps',

    'ex.eyebrow': 'Qué hacer',
    'ex.title': 'Nuestros rincones favoritos',
    'ex.text': 'Benalmádena es preciosa todo el año: incluso en invierno, durante el día suele haber unos 17 °C.',
    'alt.beach': 'Playa en verano con un parque acuático hinchable',
    'ex.beach.t': 'Playas',
    'ex.beach.d': 'La playa más cercana, Santa Ana, está a solo 400 m, y hay muchas más a lo largo de la costa.',
    'alt.prom': 'Paseo marítimo con farolillos y palmeras',
    'ex.prom.t': 'Paseo marítimo',
    'ex.prom.d': 'Chiringuitos, cafeterías y un largo paseo junto al mar hasta Torremolinos.',
    'alt.marina': 'Yates y edificios blancos en Puerto Marina',
    'ex.marina.t': 'Puerto Marina',
    'ex.marina.d': 'El puerto deportivo con restaurantes y bares, el acuario Sea Life y paseos en barco.',
    'alt.paloma': 'Césped y palmeras en el Parque de la Paloma con montañas al fondo',
    'ex.paloma.d': 'Un gran parque con lago, animales en libertad y zonas de juego: ideal para niños.',
    'ex.colomares.d': 'Un monumento de cuento dedicado a Cristóbal Colón en la ladera sobre la costa.',
    'alt.stupa': 'La Estupa budista sobre Benalmádena',
    'ex.pueblo.t': 'Benalmádena Pueblo y la Estupa',
    'ex.pueblo.d': 'Un pueblo blanco andaluz sobre la costa y una estupa budista con vistas a todo el litoral.',
    'ex.more': 'Más ideas',
    'ex.tip.cable': '<strong>Teleférico</strong> al monte Calamorro: vistas panorámicas de toda la costa.',
    'ex.tip.malaga': '<strong>Málaga</strong>, a unos 30 minutos en tren: la Alcazaba, la catedral y el Museo Picasso.',
    'ex.tip.bonanza': '<strong>Nuestro consejo para la noche:</strong> la Plaza Bonanza, llena de restaurantes y bares.',
    'ex.tip.trips': '<strong>Excursiones en coche:</strong> Mijas (25 min), Marbella (35 min), Nerja (1 h), Caminito del Rey (1 h), Ronda (1,5 h), Granada (1 h 45 min).',

    'rev.eyebrow': 'Opiniones',
    'rev.count': '38 opiniones en Booking.com',
    'rev.link': 'Leer las opiniones en Booking.com',
    'rev.title': 'A los huéspedes les encantan la ubicación y las vistas',
    'rev.text': 'Los huéspedes destacan sobre todo la ubicación cerca de la playa, la limpieza, las vistas desde el balcón, la cocina bien equipada y una comunicación rápida y amable.',
    'rev.c.location': 'Ubicación',
    'rev.c.comfort': 'Confort',
    'rev.c.staff': 'Personal',
    'rev.c.clean': 'Limpieza',
    'rev.c.value': 'Relación calidad-precio',
    'rev.c.facilities': 'Instalaciones y servicios',

    'info.eyebrow': 'Información práctica',
    'info.title': 'Antes de llegar',
    'info.in.t': 'Entrada',
    'info.in.d': 'Desde las 15:00. Con el check-in autónomo también puedes llegar más tarde sin coste adicional; solo avísanos de tu hora de llegada.',
    'info.out.t': 'Salida y estancia mínima',
    'info.out.d': 'Salida hasta las 10:00. La estancia mínima es de 4 noches.',
    'info.guests.t': 'Huéspedes',
    'info.guests.d': 'Máximo 4 personas. No hay camas supletorias.',
    'info.kids.t': 'Niños',
    'info.kids.d': 'Se admiten niños de todas las edades. Cuna (0–3 años) gratis bajo petición.',
    'info.pool.t': 'Piscina',
    'info.pool.d': 'La piscina exterior del jardín del complejo abre de mediados de junio a finales de septiembre.',
    'info.lift.t': 'Ascensor',
    'info.lift.d': 'El apartamento está en la 8.ª planta, la penúltima, y el edificio tiene ascensor.',
    'info.parking.t': 'Aparcamiento',
    'info.parking.d': 'El apartamento no incluye plaza de aparcamiento.',
    'info.rules.t': 'Normas',
    'info.rules.d': 'Apartamento para no fumadores. No se admiten mascotas, fiestas ni despedidas de soltero/a.',
    'info.airport.t': 'Desde el aeropuerto',
    'info.airport.d': 'Unos 15 minutos en taxi, o en el tren C1 hasta Benalmádena–Arroyo de la Miel (unos 15 min); desde allí, 1,4 km.',

    'contact.eyebrow': 'Reservas y contacto',
    'contact.title': 'Reserva tu estancia directamente con nosotros',
    'contact.text': 'Envíanos tus fechas y el número de huéspedes: comprobamos la disponibilidad y te respondemos con el precio y las condiciones. También puedes reservar en Booking.com.',
    'direct.title': 'Por qué reservar directamente',
    'direct.p1': 'Tratas directamente con nosotros, en español, inglés o checo',
    'direct.p2': 'Acordamos la entrega de llaves como mejor te venga, incluso en Praga',
    'direct.p3': 'Te ayudamos con el viaje y con consejos en destino',
    'book.title': '¿Prefieres Booking.com?',
    'book.text': 'La disponibilidad y los precios también están en Booking.com, donde puedes reservar al momento.',
    'contact.direct': 'Contacto directo',
    'form.title': 'Solicitud de reserva',
    'form.intro': 'Elige las fechas en el calendario, escribe tu nombre y e-mail y envíanos la solicitud. Recibirás un e-mail confirmando que ha llegado; respondemos en español, inglés o checo.',
    'form.email': 'E-mail',
    'form.send': 'Enviar solicitud',
    'form.errName': 'Escribe tu nombre, por favor.',
    'form.errEmail': 'Introduce un e-mail válido, por favor.',
    'form.errNoDates': 'Elige las fechas de llegada y salida, por favor.',
    'form.sending': 'Enviando…',
    'form.done': '¡Gracias! Hemos recibido tu solicitud y te responderemos pronto. Te hemos enviado una confirmación por e-mail: si no la ves, revisa la carpeta de spam y márcala como «no es spam» para que también te llegue nuestra respuesta.',
    'form.failed': 'No se ha podido enviar la solicitud. Inténtalo de nuevo o escríbenos a {email}.',
    'cal.title': 'Disponibilidad',
    'cal.prev': 'Mes anterior',
    'cal.next': 'Mes siguiente',
    'cal.free': 'Libre',
    'cal.busy': 'Ocupado',
    'cal.stay': 'Tu estancia',
    'cal.hint': 'Pulsa el día de llegada y después el de salida.',
    'cal.pickDeparture': 'Ahora pulsa el día de salida.',
    'cal.loading': 'Cargando disponibilidad…',
    'cal.error': 'Ahora no se ha podido cargar la disponibilidad. Envíanos tus fechas y lo comprobamos.',
    'cal.stale': 'Disponibilidad actualizada por última vez el {date}. Siempre confirmamos las fechas.',
    'cal.conflict': 'Las fechas elegidas coinciden con días ocupados; elige otras o escríbenos.',
    'cal.nights': { one: 'noche', other: 'noches' },
    'cal.minStay': 'Estancia mínima: {nights}.',
    'cal.noRoom': 'Desde este día no cabe la estancia mínima ({nights}); elige otro día de llegada.',
    'price.title': 'Precio reservando directamente',
    'price.unit': 'por noche',
    'price.detail': 'Por el apartamento completo (hasta 4 huéspedes), ropa de cama y toallas incluidas. Estancia mínima de 4 noches.',
    'price.perNight': '{price} / noche',
    'price.note': 'Convertido desde {eur} al tipo del Banco Nacional Checo de {rate} CZK/€ ({date}).',
    'msg.price': 'Precio orientativo',
    'form.name': 'Nombre',
    'form.from': 'Llegada',
    'form.to': 'Salida',
    'form.guests': 'Huéspedes',
    'form.msg': 'Mensaje (opcional)',
    'form.msgPh': 'Hola, queríamos preguntar…',
    'form.note': 'La solicitud no es vinculante: la reserva es válida cuando la confirmemos. Solo usamos tus datos para responder a tu solicitud.',
    'form.errDates': 'La salida debe ser posterior a la llegada.',
    'msg.intro': 'Hola, nos gustaría reservar Apartment Clara directamente con vosotros.',
    'msg.name': 'Nombre',
    'msg.from': 'Llegada',
    'msg.to': 'Salida',
    'msg.guests': 'Huéspedes',
    'msg.subject': 'Solicitud de reserva – Apartment Clara',

    'footer.tag': 'Luminoso apartamento con vistas a 400 m de la playa en Benalmádena.',
    'footer.country': 'España',
    'footer.reg': 'N.º de registro',
    'footer.speak': 'Hablamos',
    'lb.close': 'Cerrar',
    'lb.prev': 'Foto anterior',
    'lb.next': 'Foto siguiente',
  },
};

let lang = 'en';
const originals = new WeakMap();   // původní (anglický) obsah prvků

const text = key => T[lang][key] ?? T.en[key] ?? key;

function detectLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  try {
    const saved = localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch {}
  for (const l of navigator.languages || [navigator.language]) {
    const code = (l || '').slice(0, 2).toLowerCase();
    if (code === 'cs' || code === 'sk') return 'cs';
    if (['es', 'ca', 'gl', 'eu'].includes(code)) return 'es';
    if (code === 'en') return 'en';
  }
  return 'en';
}

// slot = co se překládá ('html' nebo název atributu); originál se uloží při prvním překladu
function translate(el, slot, key, read, write) {
  if (!originals.has(el)) originals.set(el, {});
  const store = originals.get(el);
  if (!(slot in store)) store[slot] = read();
  const value = lang === 'en' ? store[slot] : T[lang][key];
  if (value === undefined) console.warn(`Chybí překlad [${lang}] ${key}`);
  write(value ?? store[slot]);
}

function applyLang(next) {
  lang = next;
  document.documentElement.lang = lang;

  document.querySelectorAll('[data-i18n]').forEach(el =>
    translate(el, 'html', el.dataset.i18n, () => el.innerHTML, v => { el.innerHTML = v; }));

  for (const attr of ATTRS) {
    document.querySelectorAll(`[data-i18n-${attr}]`).forEach(el =>
      translate(el, attr, el.getAttribute(`data-i18n-${attr}`), () => el.getAttribute(attr), v => el.setAttribute(attr, v)));
  }

  document.querySelectorAll('[data-num]').forEach(el => {
    const raw = el.dataset.num;
    const digits = (raw.split('.')[1] || '').length;
    el.textContent = new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(+raw);
  });

  document.querySelectorAll('[data-booking]').forEach(a => { a.href = `${BOOKING_URL}.${BOOKING_LANG[lang]}.html`; });
  document.querySelectorAll('[data-set-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.setLang === lang)));
  renderPrices();
}

function applyContacts() {
  const links = {
    phone: CONFIG.phone && 'tel:' + CONFIG.phone.replace(/[^\d+]/g, ''),
    whatsapp: CONFIG.whatsapp && 'https://wa.me/' + CONFIG.whatsapp.replace(/\D/g, ''),
    email: CONFIG.email && 'mailto:' + CONFIG.email,
  };
  document.querySelectorAll('[data-contact]').forEach(el => {
    const type = el.dataset.contact;
    (el.closest('li') || el).hidden = !links[type];
    if (!links[type]) return;
    el.href = links[type];
    if (el.hasAttribute('data-contact-text')) el.textContent = CONFIG[type];
  });
}

// ===== Přepínač jazyků =====
document.querySelectorAll('[data-set-lang]').forEach(button => button.addEventListener('click', () => {
  applyLang(button.dataset.setLang);
  renderCalendar();
  checkDates();
  try { localStorage.setItem('lang', lang); } catch {}
  try {
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  } catch {}
}));

// ===== Hlavička a mobilní menu =====
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const closeNav = () => { header.classList.remove('nav-open'); navToggle.setAttribute('aria-expanded', 'false'); };
navToggle.addEventListener('click', () => navToggle.setAttribute('aria-expanded', String(header.classList.toggle('nav-open'))));
document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', closeNav));
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 8), { passive: true });

// ===== Galerie =====
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lb-img');
const shots = [...document.querySelectorAll('.gallery a')];
let current = 0;

function showShot(i) {
  current = (i + shots.length) % shots.length;
  const img = shots[current].querySelector('img');
  lbImg.src = shots[current].getAttribute('href');
  lbImg.alt = img.alt;
  document.getElementById('lb-cap').textContent = img.alt;
  document.getElementById('lb-count').textContent = `${current + 1} / ${shots.length}`;
}

shots.forEach((a, i) => a.addEventListener('click', e => {
  e.preventDefault();
  showShot(i);
  lightbox.showModal();
}));
lightbox.addEventListener('click', e => {
  const action = e.target.closest('[data-lb]')?.dataset.lb;
  if (action === 'prev') showShot(current - 1);
  else if (action === 'next') showShot(current + 1);
  else if (action === 'close' || e.target === lightbox) lightbox.close();
});
lightbox.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') showShot(current - 1);
  if (e.key === 'ArrowRight') showShot(current + 1);
});
let touchX = null;
lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
lightbox.addEventListener('touchend', e => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) showShot(current + (dx < 0 ? 1 : -1));
  touchX = null;
});

// ===== Poptávkový formulář: pošle poptávku Google skriptu (potvrzení hostovi + e-mail nám) =====
const form = document.getElementById('inquiry');
const formError = form.querySelector('.form-error');
const formStatus = form.querySelector('.form-status');
const sendButton = form.querySelector('[type="submit"]');
const today = new Date();
form.elements.from.min = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function stayPriceText() {
  const { from, to } = form.elements;
  const nights = from.value && to.value > from.value ? nightsBetween(from.value, to.value) : 0;
  return nights >= CONFIG.minNights ? stayPrice(nights) : '';
}

// text poptávky pro náhradní cestu přes e-mail hosta (když není nastavený Google skript)
function inquiryText() {
  const data = new FormData(form);
  const date = d => d
    ? new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${d}T12:00`))
    : '–';
  const lines = [
    text('msg.intro'),
    `${text('msg.name')}: ${data.get('name').trim() || '–'}`,
    `${text('msg.from')}: ${date(data.get('from'))}`,
    `${text('msg.to')}: ${date(data.get('to'))}`,
    `${text('msg.guests')}: ${data.get('guests')}`,
  ];
  const price = stayPriceText();
  if (price) lines.push(`${text('msg.price')}: ${nightsLabel(nightsBetween(data.get('from'), data.get('to')))} · ${price}`);
  const note = data.get('msg').trim();
  if (note) lines.push('', note);
  return lines.join('\n');
}

// Špatné pořadí dat a kratší než minimální pobyt blokují odeslání,
// kolize s obsazenými dny jen upozorní (termín stejně potvrzujeme ručně)
function checkDates() {
  const { from, to } = form.elements;
  const wrongOrder = Boolean(from.value && to.value && to.value <= from.value);
  const tooShort = !wrongOrder && Boolean(from.value && to.value) && nightsBetween(from.value, to.value) < CONFIG.minNights;
  const clash = !wrongOrder && !tooShort && from.value && to.value && !stayIsFree(from.value, to.value);
  formError.textContent = wrongOrder ? text('form.errDates') : tooShort ? minStayText() : clash ? text('cal.conflict') : '';
  formError.hidden = !formError.textContent;
  return wrongOrder || tooShort;
}

function onDatesChanged() {
  calNotice = '';
  form.elements.to.min = form.elements.from.value;
  checkDates();
  renderCalendar();
}

// před odesláním: termín (checkDates), jméno, platný e-mail a vybrané dny
function formIsValid() {
  if (checkDates()) return false;
  const { name, email, from, to } = form.elements;
  const problem = !name.value.trim() ? 'form.errName'
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? 'form.errEmail'
    : !from.value || !to.value ? 'form.errNoDates'
    : '';
  if (problem) {
    formError.textContent = text(problem);
    formError.hidden = false;
  }
  return !problem;
}

const showStatus = message => {
  formStatus.textContent = message;
  formStatus.hidden = !message;
};

const onFormEdit = e => { if (e.target.type === 'date') onDatesChanged(); };
form.addEventListener('input', onFormEdit);
form.addEventListener('change', onFormEdit);

form.addEventListener('submit', async e => {
  e.preventDefault();
  showStatus('');
  if (!formIsValid()) return;
  if (!CONFIG.inquiryUrl) {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(text('msg.subject'))}&body=${encodeURIComponent(inquiryText())}`;
    return;
  }
  const data = new FormData(form);
  sendButton.disabled = true;
  showStatus(text('form.sending'));
  try {
    // obyčejný text (ne JSON hlavička), aby prohlížeč neposílal předběžný CORS dotaz, který Google neumí
    const response = await fetch(CONFIG.inquiryUrl, {
      method: 'POST',
      body: JSON.stringify({
        lang,
        name: data.get('name').trim(),
        email: data.get('email').trim(),
        from: data.get('from'),
        to: data.get('to'),
        guests: data.get('guests'),
        message: data.get('msg').trim(),
        price: stayPriceText(),
        website: data.get('website'),
      }),
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'odmítnuto');
    form.reset();
    onDatesChanged();
    showStatus(text('form.done'));
  } catch (err) {
    console.warn('Poptávka se neodeslala:', err);
    showStatus('');
    formError.textContent = text('form.failed').replace('{email}', CONFIG.email);
    formError.hidden = false;
  } finally {
    sendButton.disabled = false;
  }
});

// ===== Kalendář obsazenosti (Booking + Google kalendář přímých rezervací): aktuální stav dodá Google skript,
// zálohou je availability.json, který GitHub obnovuje zhruba jednou za hodinu (nese i kurz ČNB) =====
const calendar = document.getElementById('availability');
const calMonths = calendar.querySelector('.cal-months');
const calSummary = calendar.querySelector('.cal-summary');
const monthCount = () => (calendar.clientWidth >= 520 ? 2 : 1);   // dva měsíce vedle sebe, jen když se vejdou
const busyNights = new Set();   // každá obsazená noc jako 'RRRR-MM-DD'
let calState = 'loading';
let checkedOn = null;           // kdy byla obsazenost naposledy ověřena
let liveLoaded = false;         // obsazenost už přišla přímo z Google skriptu (má přednost před zálohou)
let eurCzk = null;              // kurz eura ČNB (přichází s obsazeností)
let rateDate = null;
let calNotice = '';             // jednorázové upozornění pod kalendářem (krátký pobyt apod.)
let calStart = new Date(today.getFullYear(), today.getMonth(), 1);

const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const legend = key => calendar.querySelector(`[data-i18n="${key}"]`).textContent;

function stayIsFree(first, last) {
  for (let d = fromIso(first); isoDate(d) < last; d = addDays(d, 1)) {
    if (busyNights.has(isoDate(d))) return false;
  }
  return true;
}

function nightsLabel(n) {
  const forms = text('cal.nights');
  return `${n} ${forms[new Intl.PluralRules(LOCALE[lang]).select(n)] ?? forms.other}`;
}

const nightsBetween = (first, last) => Math.round((fromIso(last) - fromIso(first)) / 864e5);
const minStayText = () => text('cal.minStay').replace('{nights}', nightsLabel(CONFIG.minNights));
const money = (amount, currency) =>
  new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

// Cena za noc: v češtině v korunách podle kurzu ČNB (na celé koruny), jinak v eurech
function nightlyPrice() {
  return lang === 'cs' && eurCzk
    ? { amount: Math.round(CONFIG.nightlyEur * eurCzk), currency: 'CZK' }
    : { amount: CONFIG.nightlyEur, currency: 'EUR' };
}

function stayPrice(nights) {
  const { amount, currency } = nightlyPrice();
  return money(nights * amount, currency);
}

function renderPrices() {
  const { amount, currency } = nightlyPrice();
  const perNight = money(amount, currency);
  document.querySelectorAll('[data-price="night"]').forEach(el => { el.textContent = perNight; });
  document.querySelectorAll('[data-price="per-night"]').forEach(el => { el.textContent = text('price.perNight').replace('{price}', perNight); });
  document.querySelectorAll('[data-price="note"]').forEach(el => {
    el.hidden = currency !== 'CZK';
    if (el.hidden) return;
    el.textContent = text('price.note')
      .replace('{eur}', money(CONFIG.nightlyEur, 'EUR'))
      .replace('{rate}', new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(eurCzk))
      .replace('{date}', new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'numeric', year: 'numeric' }).format(rateDate));
  });
}

function calendarSummary() {
  const { from, to } = form.elements;
  const short = new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'numeric', year: 'numeric' });
  if (calState !== 'ready') return text(calState === 'loading' ? 'cal.loading' : 'cal.error');
  if (calNotice) return calNotice;
  if (from.value && to.value > from.value) {
    const nights = nightsBetween(from.value, to.value);
    if (nights < CONFIG.minNights) return minStayText();
    return `${legend('cal.stay')}: ${short.format(fromIso(from.value))} – ${short.format(fromIso(to.value))} · ${nightsLabel(nights)} · ${stayPrice(nights)}`;
  }
  const hint = from.value && !to.value ? text('cal.pickDeparture') : `${text('cal.hint')} ${minStayText()}`;
  const stale = checkedOn && checkedOn < addDays(today, -2);
  return stale ? `${hint} ${text('cal.stale').replace('{date}', short.format(checkedOn))}` : hint;
}

function renderCalendar() {
  calendar.className = `availability is-${calState}`;
  calSummary.textContent = calendarSummary();
  const [chosenFrom, chosenTo] = [form.elements.from.value, form.elements.to.value];
  calSummary.classList.toggle('is-set', calState === 'ready' && !calNotice && Boolean(chosenFrom) && chosenTo > chosenFrom
    && nightsBetween(chosenFrom, chosenTo) >= CONFIG.minNights);
  calMonths.innerHTML = '';
  if (calState !== 'ready') return;

  const { from, to } = form.elements;
  const todayKey = isoDate(today);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthName = new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', year: 'numeric' });
  const weekdayName = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short' });
  const dayName = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) => weekdayName.format(new Date(2024, 0, 1 + i)));  // 1. 1. 2024 bylo pondělí

  const count = monthCount();
  calMonths.classList.toggle('single', count === 1);
  for (let m = 0; m < count; m++) {
    const first = new Date(calStart.getFullYear(), calStart.getMonth() + m, 1);
    const month = document.createElement('div');
    month.innerHTML = `<p class="cal-caption">${monthName.format(first)}</p>
      <div class="cal-grid">${weekdays.map(w => `<span class="cal-wd">${w}</span>`).join('')}</div>`;
    const grid = month.querySelector('.cal-grid');
    for (let i = (first.getDay() + 6) % 7; i > 0; i--) grid.append(document.createElement('span'));
    for (let d = first; d.getMonth() === first.getMonth(); d = addDays(d, 1)) {
      const key = isoDate(d);
      const busy = busyNights.has(key);
      const end = key === from.value || key === to.value;
      const stay = Boolean(from.value && to.value && key > from.value && key < to.value);
      const day = document.createElement('button');
      day.type = 'button';
      day.className = 'cal-day';
      day.classList.toggle('is-today', key === todayKey);
      day.classList.toggle('is-busy', busy);
      day.classList.toggle('is-stay', stay);
      day.classList.toggle('is-end', end);
      day.dataset.date = key;
      day.disabled = key < todayKey;
      day.textContent = d.getDate();
      day.setAttribute('aria-label', `${dayName.format(d)}, ${legend(busy ? 'cal.busy' : 'cal.free')}`);
      if (end || stay) day.setAttribute('aria-pressed', 'true');
      grid.append(day);
    }
    calMonths.append(month);
  }
  calendar.querySelector('[data-cal="prev"]').disabled = calStart <= thisMonth;
  calendar.querySelector('[data-cal="next"]').disabled = calStart >= new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 16, 1);
}

// první klik = příjezd (musí se vejít minimální pobyt), druhý = odjezd (pozdější, bez obsazených nocí mezi)
calMonths.addEventListener('click', e => {
  const day = e.target.closest('.cal-day');
  if (!day || day.disabled) return;
  const key = day.dataset.date;
  const { from, to } = form.elements;
  const minEnd = first => isoDate(addDays(fromIso(first), CONFIG.minNights));
  const notice = message => { calNotice = message; renderCalendar(); };
  if (from.value && !to.value && key > from.value && stayIsFree(from.value, key)) {
    if (key < minEnd(from.value)) return notice(minStayText());
    to.value = key;
  } else if (!busyNights.has(key)) {
    if (!stayIsFree(key, minEnd(key))) return notice(text('cal.noRoom').replace('{nights}', nightsLabel(CONFIG.minNights)));
    from.value = key;
    to.value = '';
  } else {
    return;
  }
  onDatesChanged();
});

calendar.querySelector('.cal-nav').addEventListener('click', e => {
  const step = { prev: -1, next: 1 }[e.target.closest('[data-cal]')?.dataset.cal];
  if (!step) return;
  calStart = new Date(calStart.getFullYear(), calStart.getMonth() + step, 1);
  calNotice = '';
  renderCalendar();
});
let shownMonths = 0;
new ResizeObserver(() => {
  if (monthCount() !== shownMonths) renderCalendar();
  shownMonths = monthCount();
}).observe(calendar);

function setBusy(ranges) {
  busyNights.clear();
  for (const [first, last] of ranges) {
    for (let d = fromIso(first); isoDate(d) < last; d = addDays(d, 1)) busyNights.add(isoDate(d));
  }
}

async function loadAvailability() {
  try {
    const response = await fetch('availability.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!liveLoaded) {
      setBusy(data.busy);
      checkedOn = fromIso(data.checked);
    }
    eurCzk = data.eurCzk ?? null;
    rateDate = data.rateDate ? fromIso(data.rateDate) : null;
    calState = 'ready';
  } catch (err) {
    console.warn('Obsazenost se nenačetla:', err);
    if (!liveLoaded) calState = 'error';
  }
  renderPrices();
  renderCalendar();
  checkDates();
}

// Aktuální obsazenost přímo z kalendářů přes Google skript; když neodpoví, zůstane záloha z availability.json
async function loadLiveAvailability() {
  if (!CONFIG.inquiryUrl) return;
  try {
    const response = await fetch(`${CONFIG.inquiryUrl}?availability=1`, { signal: AbortSignal.timeout?.(20000) });
    const data = await response.json();
    if (!data.ok || !Array.isArray(data.busy)) throw new Error(data.error || 'skript nevrátil obsazenost');
    setBusy(data.busy);
    checkedOn = fromIso(data.checked || isoDate(today));
    liveLoaded = true;
    calState = 'ready';
  } catch (err) {
    console.warn('Aktuální obsazenost se nenačetla, platí záloha:', err);
    return;
  }
  renderCalendar();
  checkDates();
}

document.getElementById('year').textContent = new Date().getFullYear();
applyContacts();
applyLang(detectLang());
renderCalendar();
loadAvailability();       // záloha (rychlá, z webu) a kurz ČNB
loadLiveAvailability();   // aktuální stav ze skriptu; když dorazí, přepíše zálohu
