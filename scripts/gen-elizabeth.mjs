// Genera src/data/elizabeth.json: los encargos de Elizabeth con el día en que la guía los
// acepta y el día en que los entrega, sacado de los MD de TenSquare3 (Guia/02.md … 11.md).
//
// Uso: node scripts/gen-elizabeth.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['02.md', '03.md', '04.md', '05.md', '06.md', '07.md', '08.md', '09.md', '10.md', '11.md'];

const quests = new Map();
const nums = (s) => [...s.matchAll(/\d{1,3}/g)].map((m) => Number(m[0])).filter((n) => n >= 1 && n <= 101);

for (const f of FILES) {
  const raw = readFileSync(join(ROOT, 'Guia', f), 'utf-8');
  const body = raw.slice(raw.indexOf('\n## Main Game\n'), raw.indexOf('\n## Privacy Preference Center'));
  let date = null;
  for (const line of body.split('\n')) {
    const dh = line.match(/^(?:#{3,4}\s*)?\*\*(\d{1,2})\/(\d{1,2})(?:\s+[A-Za-z]+)?\*\*\s*$/);
    if (dh) { date = `${Number(dh[1])}/${Number(dh[2])}`; continue; }
    if (!date) continue;
    const l = line.replace(/^>\s?/, '');
    // tablas de estado de fin de mes: "| 34\. Create a Persona with Torrent Shot | Done |"
    const t = l.match(/^\|\s*(\d{1,3})\\?[.:]\s*(.+?)\s*\|\s*([^|]*)\|?\s*$/);
    if (t) {
      const n = Number(t[1]);
      const e = quests.get(n) ?? { n, name: '', accepted: null, done: null };
      if (!e.name) e.name = t[2].replace(/\*\*/g, '');
      if (!e.done && /done/i.test(t[3])) e.done = date;
      quests.set(n, e);
      continue;
    }
    // "- 18. I'd like to be gifted a bouquet of flowers"
    const q = l.match(/^\s*[-*]\s*(\d{1,3})\\?[.:]\s*(.+?)\s*$/);
    if (q) {
      const n = Number(q[1]);
      if (n >= 1 && n <= 101 && !/^\d+x /.test(q[2]) && !quests.has(n)) {
        quests.set(n, { n, name: q[2].replace(/\*\*/g, '').replace(/\s*\(.*?\)\s*$/, ''), accepted: date, done: null });
      }
      continue;
    }
    // "Hand in quests 16, 21 and 26", "turn in quests 34 and 38", "hand in quest 42 to Elizabeth"
    const h = l.match(/(?:hand(?:ed)?|turn)\s+(?:(?:it|this)\s+)?(?:in\s+)?quests?\s+((?:\d{1,3}(?:\s*,\s*and\s+|\s*,\s*|\s+and\s+|\s*&\s*)?)+)/i);
    if (h) for (const n of nums(h[1])) { const e = quests.get(n); if (e && !e.done) e.done = date; else if (!e) quests.set(n, { n, name: '', accepted: null, done: date }); }
  }
}

const list = [...quests.values()].sort((a, b) => a.n - b.n);
writeFileSync(join(ROOT, 'src', 'data', 'elizabeth.json'), JSON.stringify(list, null, 2) + '\n');
const missing = Array.from({ length: 101 }, (_, i) => i + 1).filter((n) => !quests.has(n));
console.log(`${list.length} encargos · sin nombre: ${list.filter((q) => !q.name).map((q) => q.n).join(',') || '-'} · sin entrega: ${list.filter((q) => !q.done).map((q) => q.n).join(',') || '-'} · faltan: ${missing.join(',') || '-'}`);
