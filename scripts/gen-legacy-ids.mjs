// Mapea los ids viejos de abril/mayo (escritos a mano, "abril-406-0-0") a los nuevos
// generados desde la guía ("abril-406-<hash>"), para no perder el progreso tildado.
//
// Uso (una sola vez, ya corrido): node scripts/gen-legacy-ids.mjs <abril-viejo.json> <mayo-viejo.json>
// Los JSON viejos están en git: git show a32d207:src/data/walkthrough/abril.json
//
// Salida: src/data/legacy-ids.json = [[ [ids viejos del día], [ids nuevos del día], {viejo: [nuevos que "cubre"]} ], ...]
// En el cliente (src/lib/store.ts): si el día viejo estaba todo tildado se tildan todos los nuevos;
// si no, cada ítem viejo tildado tilda los nuevos que cubre.

import { readFileSync, writeFileSync } from 'node:fs';

const [oldAbril, oldMayo] = process.argv.slice(2);
if (!oldAbril || !oldMayo) { console.error('Faltan los JSON viejos'); process.exit(1); }

const STOP = new Set('que con por para los las del una uno unos unas como más pero sus tus vos ahí esta este esto hasta desde cuando donde todo toda todos todas tenés podés hacé andá muy hay ese esa eso'.split(' '));
const norm = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const tokens = (it) => new Set(norm([it.text, ...(it.sub ?? [])].join(' ')).split(/[^a-z0-9]+/).filter((w) => (w.length >= 4 || /^\d+f?$/.test(w)) && !STOP.has(w)));
const items = (day) => day.slots.flatMap((s) => s.items.filter((i) => !i.note));

const out = [];
for (const [oldPath, key] of [[oldAbril, 'abril'], [oldMayo, 'mayo']]) {
  const oldM = JSON.parse(readFileSync(oldPath, 'utf-8'));
  const newM = JSON.parse(readFileSync(new URL(`../src/data/walkthrough/${key}.json`, import.meta.url), 'utf-8'));
  for (const od of oldM.days) {
    const nd = newM.days.find((d) => d.date === od.date);
    if (!nd) { console.warn('Día sin par:', od.date); continue; }
    const olds = items(od).map((i) => ({ id: i.id, tk: tokens(i) }));
    const news = items(nd).map((i) => ({ id: i.id, tk: tokens(i) }));
    const cover = {};
    let prev = olds[0]?.id;
    for (const n of news) {
      let best = null, score = 0;
      for (const o of olds) {
        let c = 0;
        for (const w of n.tk) if (o.tk.has(w)) c++;
        const s = c / Math.sqrt(Math.max(1, n.tk.size) * Math.max(1, o.tk.size));
        if (s > score) { score = s; best = o.id; }
      }
      const owner = score >= 0.12 ? best : prev;
      prev = owner;
      if (owner) (cover[owner] ??= []).push(n.id);
    }
    out.push([olds.map((o) => o.id), news.map((n) => n.id), cover]);
  }
}
// ítems sueltos "(Episodio …) (Encanto +1)" que pasaron a ser sub del ítem anterior
out.push([['julio-724-ee4526aa'], ['julio-724-1d9e5feb'], {}], [['agosto-809-d98caab8'], ['agosto-809-f38692bf'], {}]);
writeFileSync(new URL('../src/data/legacy-ids.json', import.meta.url), JSON.stringify(out) + '\n');
console.log(`${out.length} días mapeados, ${out.reduce((a, d) => a + d[0].length, 0)} ids viejos → ${out.reduce((a, d) => a + d[1].length, 0)} nuevos`);
