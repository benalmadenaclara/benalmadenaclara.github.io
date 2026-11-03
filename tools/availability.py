"""Sloučí obsazenost z Bookingu a z kalendáře přímých rezervací do availability.json
a přidá k ní denní kurz eura ČNB (podle něj web v češtině ukazuje ceny v korunách).

Adresy kalendářů se berou z proměnných prostředí BOOKING_ICAL a DIRECT_ICAL. Na GitHubu jsou
uložené jako tajné hodnoty repozitáře, takže nejsou v kódu ani na webu. Do výstupu jdou jen
obsazené noci (bez jmen a poznámek).

Použití: python tools/availability.py availability.json
"""
import json
import os
import re
import sys
import time
import urllib.request
from datetime import date, datetime, timedelta, timezone

HORIZON_DAYS = 550  # jak daleko dopředu web obsazenost ukazuje (~18 měsíců)
CNB_RATES = 'https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/kurzy-devizoveho-trhu/denni_kurz.txt'


def fetch(url, attempts=3):
    """Krátký výpadek kalendáře zkusí přečkat, teprve pak úloha selže."""
    request = urllib.request.Request(url, headers={'User-Agent': 'apartment-clara-availability'})
    for attempt in range(1, attempts + 1):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode('utf-8', 'replace')
        except OSError:  # chyby sítě i HTTP
            if attempt == attempts:
                raise
            time.sleep(15)


def to_date(value):
    return date(int(value[:4]), int(value[4:6]), int(value[6:8]))


def busy_ranges(ics):
    """Vrátí seznam (příjezd, odjezd); odjezd se nepočítá, stejně jako DTEND v iCal."""
    text = re.sub(r'\r?\n[ \t]', '', ics)  # zalomené řádky iCal patří k předchozímu řádku
    ranges = []
    for event in re.findall(r'BEGIN:VEVENT(.*?)END:VEVENT', text, re.S):
        if re.search(r'^STATUS:CANCELLED', event, re.M):
            continue
        start = re.search(r'^DTSTART[^:\n]*:(\d{8})', event, re.M)
        if not start:
            continue
        end = re.search(r'^DTEND[^:\n]*:(\d{8})', event, re.M)
        first = to_date(start.group(1))
        last = to_date(end.group(1)) if end else first
        ranges.append((first, max(last, first + timedelta(days=1))))
    return ranges


def merge(ranges, today, horizon):
    merged = []
    for first, last in sorted(ranges):
        first, last = max(first, today), min(last, horizon)
        if last <= first:
            continue
        if merged and first <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], last)
        else:
            merged.append([first, last])
    return merged


def eur_rate(previous):
    """Kurz eura ČNB; když se nenačte, zůstane poslední známý (kvůli kurzu úloha neselže)."""
    try:
        text = fetch(CNB_RATES, attempts=2)  # první řádek: "03.11.2026 #211", pak "EMU|euro|1|EUR|24,340"
        day = datetime.strptime(text.split()[0], '%d.%m.%Y').date()
        rate = next(float(line.split('|')[4].replace(',', '.')) for line in text.splitlines() if '|EUR|' in line)
        return {'eurCzk': rate, 'rateDate': day.isoformat()}
    except Exception as err:
        print(f'Kurz ČNB se nenačetl ({err}), zůstává předchozí.', file=sys.stderr)
        return {key: previous[key] for key in ('eurCzk', 'rateDate') if key in previous}


def main(out_path):
    today = datetime.now(timezone.utc).date()
    try:
        with open(out_path, encoding='utf-8') as f:
            previous = json.load(f)
    except (OSError, ValueError):
        previous = {}
    ranges = []
    for name in ('BOOKING_ICAL', 'DIRECT_ICAL'):
        url = os.environ.get(name)
        if not url:
            sys.exit(f'Chybí adresa kalendáře v proměnné {name}.')
        ranges += busy_ranges(fetch(url))
    busy = merge(ranges, today, today + timedelta(days=HORIZON_DAYS))
    data = {
        'checked': today.isoformat(),  # mění se denně, podle toho web pozná zastaralá data
        **eur_rate(previous),
        'busy': [[first.isoformat(), last.isoformat()] for first, last in busy],
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=1)
        f.write('\n')
    print(f'{len(busy)} obsazených období zapsáno do {out_path}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'availability.json')
