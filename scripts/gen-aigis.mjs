// Genera src/data/aigis.json (Episode Aigis: The Answer) desde Guia/15–19.md de TenSquare3.
//
// Uso:
//   node scripts/gen-aigis.mjs            → genera aigis.json
//   node scripts/gen-aigis.mjs --pending  → escribe scripts/i18n/pending.tsv con lo que falta traducir
//
// Usa el mismo parser y las mismas traducciones (scripts/i18n) que el walkthrough principal.
// Cada parte es una lista de secciones (las zonas del dungeon) con ítems tildables.
// Los ids son "ea-<modo><parte>-<hash del texto en inglés>": no cambian si se reordena el texto.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSlots, pending, isDayHeader } from './gen-walkthrough.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

const MODES = [
  {
    key: 'normal', title: 'Episode Aigis', parts: [
      { key: 'n1', file: '15.md', title: 'Parte 1 · Malebolge a Antenora' },
      { key: 'n2', file: '16.md', title: 'Parte 2 · Ptolomea a la puerta final' },
      { key: 'n3', file: '17.md', title: 'Monad Chamber y jefe secreto' },
    ],
  },
  {
    key: 'heartless', title: 'Episode Aigis en Heartless', parts: [
      { key: 'h1', file: '18.md', title: 'Heartless · Parte 1' },
      { key: 'h2', file: '19.md', title: 'Heartless · Parte 2' },
    ],
  },
];

const LABELS = {
  General: 'Antes de empezar', Introduction: 'Introducción', Checklist: 'Checklist',
  'Optional Monad Chamber': 'Monad Chamber (opcional)', Rules: 'Reglas',
  'Recommended Party, Gear and Personas': 'Grupo, equipo y Personas recomendados',
  'Joker Fight Information': 'Datos de la pelea contra Joker', 'Fight Strategy': 'Estrategia',
  'Final Door': 'Puerta final',
};
const label = (l) => LABELS[l] ?? l.replace(/^Monad Chamber (?:Boss )?(\d)$/, 'Monad Chamber: jefe $1');
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function parsePart({ key, file, title }) {
  const raw = readFileSync(join(ROOT, 'Guia', file), 'utf-8');
  const start = raw.search(/\n## Episode Aigis/);
  const end = raw.indexOf('\n## Privacy Preference Center');
  const lines = raw.slice(start, end === -1 ? undefined : end).split('\n')
    .filter((l) => !/^#{2,3} /.test(l))           // "## Episode Aigis", "### Episode Aigis - Part 1"
    .filter((l) => !isDayHeader(l))               // "**3/31 Wednesday**" (la intro ya es su propia sección)
    .filter((l) => !/^\* \* \*\s*$/.test(l))
    // reproductor de YouTube embebido con negritas rotas: "**![thumbnail]…**", "**[Watch on](…)**"
    .filter((l) => !/^\*\*\s*(?:!\[|\[Watch on\])/.test(l))
    // "**[Título](youtube) [Ten Square](canal)" (negrita sin cerrar) → párrafo con el link al video
    .map((l) => l.replace(/^\*\*(\[[^\]]+\]\(https?:\/\/(?:www\.)?youtube\.com\/watch[^)]*\).*?)(?:\*\*)?\s*$/, '$1'))
    .map((l) => l.replace(/^#### (\*\*[^*]+\*\*)\s*$/, '$1'));
  const slots = buildSlots(`ea-${key}`, lines);
  const used = new Set();
  const sections = slots.map((s) => {
    const name = label(s.label);
    let id = `${key}-${slug(name)}`;
    for (let n = 2; used.has(id); n++) id = `${key}-${slug(name)}-${n}`;
    used.add(id);
    return { id, label: name, items: s.items };
  });
  return { key, title, sections };
}

const data = { modes: MODES.map((m) => ({ key: m.key, title: m.title, parts: m.parts.map(parsePart) })) };

// logros de Episode Aigis (n/56)
const trophies = [];
for (const m of data.modes) for (const p of m.parts) for (const s of p.sections) for (const it of s.items) {
  for (const t of [it.text, ...(it.sub ?? [])]) {
    const mt = t.replace(/<[^>]+>/g, '').match(/Logro\/Trofeo:\s*(.+?)\s*(?:\(([^)]*)\)\s*)?\((\d+)\/56\)/);
    if (mt && !trophies.some((x) => x.n === Number(mt[3]))) trophies.push({ n: Number(mt[3]), name: mt[1], condition: mt[2] ?? null, mode: m.key, section: s.id, sectionLabel: s.label });
  }
}
data.trophies = trophies.sort((a, b) => a.n - b.n);

const count = (m) => m.parts.reduce((a, p) => a + p.sections.reduce((b, s) => b + s.items.filter((i) => !i.note).length, 0), 0);
for (const m of data.modes) console.log(`${m.key}: ${m.parts.length} partes, ${m.parts.reduce((a, p) => a + p.sections.length, 0)} secciones, ${count(m)} ítems`);
console.log(`logros: ${data.trophies.map((t) => t.n).join(', ')}`);
if (args.has('--pending')) {
  writeFileSync(join(ROOT, 'scripts', 'i18n', 'pending.tsv'), [...pending].map(([h, t]) => `${h}\t${t}`).join('\n') + '\n');
} else {
  writeFileSync(join(ROOT, 'src', 'data', 'aigis.json'), JSON.stringify(data, null, 2) + '\n');
}
console.log(`Sin traducir: ${pending.size} frases únicas${args.has('--pending') ? ' → scripts/i18n/pending.tsv' : ''}`);

