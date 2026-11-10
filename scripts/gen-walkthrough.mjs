// Genera src/data/walkthrough/<mes>.json a partir de los MD de TenSquare3 (Guia/*.md).
//
// Uso:
//   node scripts/gen-walkthrough.mjs            → genera los meses (no pisa JSON existentes)
//   node scripts/gen-walkthrough.mjs --force    → regenera aunque existan
//   node scripts/gen-walkthrough.mjs --pending  → lista las frases sin traducción (hash<TAB>texto)
//   node scripts/gen-walkthrough.mjs --force --only=abril,mayo → regenera solo esos meses (conserva los tips)
//
// Traducción: primero se aplican patrones (scripts/i18n/patterns.mjs). Lo que no matchea
// se busca por hash en scripts/i18n/es/*.tsv (hash<TAB>traducción). Si no hay traducción queda en inglés.
//
// IDs: cada ítem tildable recibe un id derivado del texto en inglés + día, así agregar o
// reordenar ítems no corre los ids de los demás. Una vez generados, los JSON son la fuente
// de verdad: editalos a mano y NO cambies los ids existentes.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { marked } from 'marked';
import { translateLine, translateLabel, translateWeekday, setDictionary } from './i18n/patterns.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'src', 'data', 'walkthrough');
const ES_DIR = join(ROOT, 'scripts', 'i18n', 'es');
const ES = Object.fromEntries(readdirSync(ES_DIR).filter((f) => f.endsWith('.tsv')).flatMap((f) =>
  readFileSync(join(ES_DIR, f), 'utf-8').split(/\r?\n/).filter((l) => /^[0-9a-f]{8}[\t ]/.test(l)).map((l) => [l.slice(0, 8), l.slice(9)])));
const args = new Set(process.argv.slice(2));
// --only=abril,mayo → regenera solo esos meses
const onlyArg = [...args].find((a) => a.startsWith('--only='));
const only = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;

const MONTHS = [
  { key: 'abril', file: '02.md', title: '🌑 ABRIL — Comienzo del año escolar' },
  { key: 'mayo', file: '03.md', title: '🌒 MAYO — El SEES se organiza' },
  { key: 'junio', file: '04.md', title: '🌓 JUNIO — Exámenes y la escuela de noche' },
  { key: 'julio', file: '05.md', title: '🌔 JULIO — Exámenes y vacaciones de verano' },
  { key: 'agosto', file: '06.md', title: '🌕 AGOSTO — Verano en Iwatodai' },
  { key: 'septiembre', file: '07.md', title: '🌖 SEPTIEMBRE — Vuelta a clases' },
  { key: 'octubre', file: '08.md', title: '🌗 OCTUBRE — El último arcano mayor' },
  { key: 'noviembre', file: '09.md', title: '🌘 NOVIEMBRE — La verdad' },
  { key: 'diciembre', file: '10.md', title: '🌑 DICIEMBRE — La decisión' },
  { key: 'enero', file: '11.md', title: '🌒 ENERO — La cuenta regresiva' },
];

export const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);

const pending = new Map();
setDictionary((src) => {
  const es = ES[hash(src)];
  if (es == null) pending.set(hash(src), src);
  return es ?? null;
});

// basura del reproductor de YouTube que quedó en los MD
const JUNK = /^(Tap to unmute|(?:Previous|Next): .*\(Main Game\)|Watch on|Watch later|Share|Copy link|Info|Shopping|If playback doesn't begin.*|You're signed out.*|Cancel|Confirm|More videos|Search|Include playlist|An error occurred.*|.*\d+ subscribers|0:00.*)$/i;

function cleanInline(md) {
  return md
    // links a gamefaqs / aqiu → solo el texto
    .replace(/\[([^\]]+)\]\(https?:\/\/(?:gamefaqs\.gamespot\.com|aqiu384\.github\.io)[^)]*\)/g, '$1')
    .replace(/https?:\/\/gamefaqs\.gamespot\.com\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Traduce una línea (markdown inline) y la devuelve como HTML. */
function tr(md) {
  const src = cleanInline(md);
  if (!src || JUNK.test(src)) return '';
  let es = translateLine(src);
  if (es == null) {
    const h = hash(src);
    es = ES[h];
    if (es == null) {
      // sin traducción: restos del reproductor embebido dentro de citas (miniaturas, "[Watch on](…)")
      if (/^!\[[^\]]*\]\([^)]*\)$/.test(src) || /^\[Watch on\]\(/.test(src)) return '';
      // "[Título](youtube) [Ten Square](canal)" → link al video
      const yt = src.match(/^\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+)[^)]*\)(?:\s*\[[^\]]+\]\(https?:\/\/(?:www\.)?youtube\.com\/channel\/[^)]*\))?$/);
      if (yt) return `▶ <a href="${yt[2]}" target="_blank" rel="noopener">Video: ${yt[1]}</a>`;
      pending.set(h, src); es = src;
    }
  }
  return marked.parseInline(es);
}

const isDayHeader = (l) => l.match(/^(?:#{3,4}\s*)?\*\*(\d{1,2})\/(\d{1,2})(?:\s+([A-Za-z]+))?\*\*\s*$/);
const isSlotHeader = (l) => l.match(/^(?:#{3,4}\s*)?\*\*([^*]+?):?\*\*\s*$/);

function parseBlocks(lines) {
  // agrupa líneas en bloques: para | list | quote | table
  const blocks = [];
  let cur = null;
  const flush = () => { if (cur) blocks.push(cur); cur = null; };
  for (const raw of lines) {
    const l = raw.replace(/\s+$/, '');
    if (!l.trim()) { if (cur && cur.type !== 'quote') flush(); else if (cur?.type === 'quote') cur.lines.push(''); continue; }
    if (/^>/.test(l)) {
      if (cur?.type !== 'quote') { flush(); cur = { type: 'quote', lines: [] }; }
      cur.lines.push(l.replace(/^>\s?/, ''));
      continue;
    }
    if (cur?.type === 'quote') flush();
    if (/^\|/.test(l)) {
      if (cur?.type !== 'table') { flush(); cur = { type: 'table', lines: [] }; }
      cur.lines.push(l); continue;
    }
    const li = l.match(/^(\s*)[-*+]\s+(.*)$/);
    if (li && !/^\* \* \*/.test(l)) {
      if (cur?.type !== 'list') { flush(); cur = { type: 'list', items: [] }; }
      cur.items.push({ depth: li[1].length >= 2 ? 1 : 0, text: li[2] });
      continue;
    }
    if (cur?.type === 'list' && /^\s{2,}/.test(raw)) { cur.items[cur.items.length - 1].text += ' ' + l.trim(); continue; }
    if (cur?.type !== 'para') { flush(); cur = { type: 'para', lines: [] }; }
    cur.lines.push(l.trim());
  }
  flush();
  // separa quotes en párrafos
  return blocks.flatMap((b) => {
    if (b.type !== 'quote') return [b];
    const paras = [];
    let p = [];
    for (const l of b.lines) { if (!l.trim()) { if (p.length) paras.push(p.join(' ')); p = []; } else p.push(l.trim()); }
    if (p.length) paras.push(p.join(' '));
    return paras.map((text) => ({ type: 'quote', text }));
  });
}

function tableToHtml(lines) {
  const rows = lines
    .filter((l) => !/^\|\s*-{3}/.test(l))
    .map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${tr(c.replace(/<br>/g, ' / '))}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap"><table>${body}</table></div>`;
}

function parseChecklist(blocks) {
  const out = { stats: [], sl: [], trophies: [], compendium: 0 };
  for (const b of blocks) {
    if (b.type !== 'table') continue;
    const rows = b.lines.filter((l) => !/^\|\s*-{3}/.test(l)).map((l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.replace(/\*\*/g, '').trim()));
    const head = rows[0]?.[0] ?? '';
    const data = rows.slice(1);
    if (/Social Stats/i.test(head)) out.stats = data.map(([n, r]) => ({ stat: n, rank: Number((r.match(/\d+/) || [0])[0]), label: r.replace(/^Rank\s*\d+\s*/, '').replace(/[()]/g, '') }));
    else if (/Social Links/i.test(head)) out.sl = data.map(([n, r]) => ({ arcana: n, rank: /max/i.test(r) ? 10 : Number((r.match(/\d+/) || [0])[0]) }));
    else if (/Achievement/i.test(head)) out.trophies = data.map(([n]) => n);
    else if (/Compendium/i.test(head)) out.compendium = data.length;
  }
  return out;
}

function buildDay(monthKey, date, weekday, sectionLines) {
  const [m, d] = date.split('/').map(Number);
  const dayId = `${m}${String(d).padStart(2, '0')}`;
  return { id: dayId, date, name: translateWeekday(weekday ?? ''), slots: buildSlots(`${monthKey}-${dayId}`, sectionLines) };
}

/** Convierte las líneas de una sección (con encabezados en negrita como turnos) en slots con ítems. */
export function buildSlots(idPrefix, sectionLines) {
  const day = { slots: [] };
  const seen = new Map();
  const mkId = (src) => {
    const base = `${idPrefix}-${hash(src)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n > 1 ? `${base}-${n}` : base;
  };

  let slot = null;
  const slotLines = [];
  const pushSlot = () => {
    if (!slot) return;
    const blocks = parseBlocks(slotLines.splice(0));
    const items = [];
    let last = null;
    for (const b of blocks) {
      if (b.type === 'para') {
        const text = b.lines.join(' ');
        if (/^!\[/.test(text)) continue;
        // "(Charm Rank 4)" sola → se pega al ítem anterior
        if (last && !last.note && /^\([^()]*(?:\([^()]*\)[^()]*)*\)(?:\s*\([^()]*\))*$/.test(text)) { (last.sub ??= []).push(tr(text)); continue; }
        const yt = text.match(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[\w-]+)[^)]*\)/);
        if (yt) {
          if (!JUNK.test(yt[1])) items.push({ note: true, text: `▶ <a href="${yt[2]}" target="_blank" rel="noopener">Video: ${yt[1]}</a>` });
          last = null; continue;
        }
        if (/youtube\.com| - YouTube$/.test(text)) continue;
        const t = tr(text);
        if (!t) continue;
        last = { id: mkId(cleanInline(text)), text: t };
        items.push(last);
      } else if (b.type === 'list') {
        const sub = b.items.map((i) => tr(i.text) && (i.depth ? '↳ ' : '') + tr(i.text)).filter(Boolean);
        if (last && !last.note) (last.sub ??= []).push(...sub);
        else for (const i of b.items) { const t = tr(i.text); if (!t) continue; last = { id: mkId(cleanInline(i.text)), text: t }; items.push(last); }
      } else if (b.type === 'quote') {
        const t = tr(b.text);
        if (t) items.push({ note: true, text: t });
        // una nota no corta el ítem anterior: las listas siguientes siguen siendo del ítem
      } else if (b.type === 'table') {
        items.push({ note: true, text: tableToHtml(b.lines) });
      }
    }
    if (items.length) day.slots.push({ label: translateLabel(slot), items });
  };

  for (const l of sectionLines) {
    const s = isSlotHeader(l);
    if (s && JUNK.test(s[1].trim())) continue; // "**Tap to unmute**" del reproductor embebido
    if (s && !isDayHeader(l)) { pushSlot(); slot = s[1].trim(); continue; }
    if (!slot) slot = 'General';
    slotLines.push(l);
  }
  pushSlot();
  return day.slots;
}

function parseMonth({ key, file, title }) {
  const raw = readFileSync(join(ROOT, 'Guia', file), 'utf-8');
  const start = raw.indexOf('\n## Main Game\n');
  const end = raw.indexOf('\n## Privacy Preference Center');
  const lines = raw.slice(start, end === -1 ? undefined : end).split('\n').slice(2);

  const month = { title, intro: [], days: [], checklist: null };
  let cur = null; // { date, weekday, lines }
  let intro = [];
  let eom = null;
  const flushDay = () => {
    if (!cur) return;
    month.days.push(buildDay(key, cur.date, cur.weekday, cur.lines));
    cur = null;
  };
  for (const l of lines) {
    if (/^### /.test(l)) continue; // "### June"
    const dh = isDayHeader(l);
    if (dh) { flushDay(); cur = { date: `${Number(dh[1])}/${Number(dh[2])}`, weekday: dh[3], lines: [] }; continue; }
    if (/^\*\*End of Month Checklist\*\*/.test(l)) { flushDay(); eom = []; continue; }
    if (eom) { eom.push(l); continue; }
    if (/^\* \* \*\s*$/.test(l)) continue;
    if (cur) cur.lines.push(l); else intro.push(l);
  }
  flushDay();
  month.intro = parseBlocks(intro).filter((b) => b.type !== 'table').map((b) => tr(b.type === 'list' ? b.items.map((i) => i.text).join(' · ') : b.text ?? b.lines.join(' '))).filter(Boolean);
  if (eom) month.checklist = parseChecklist(parseBlocks(eom));
  return month;
}

export { tr, pending, parseBlocks, cleanInline, JUNK, isDayHeader, isSlotHeader, tableToHtml, ES };

// se puede importar desde otros generadores (gen-aigis.mjs) sin correr la generación de meses
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) main();

function main() {
mkdirSync(OUT_DIR, { recursive: true });
const report = [];
for (const m of MONTHS) {
  const month = parseMonth(m);
  const out = join(OUT_DIR, `${m.key}.json`);
  const items = month.days.reduce((a, d) => a + d.slots.reduce((b, s) => b + s.items.filter((i) => !i.note).length, 0), 0);
  report.push(`${m.key}: ${month.days.length} días, ${items} ítems`);
  if (args.has('--pending')) continue;
  if (existsSync(out) && !args.has('--force')) { report.push(`  (existe ${m.key}.json, salteado — usá --force)`); continue; }
  if (only && !only.has(m.key)) continue;
  // los tips escritos a mano (no vienen del MD) se conservan por fecha
  if (existsSync(out)) {
    const prev = JSON.parse(readFileSync(out, 'utf-8'));
    for (const d of month.days) { const tips = prev.days?.find((x) => x.date === d.date)?.tips; if (tips?.length) d.tips = tips; }
  }
  writeFileSync(out, JSON.stringify(month, null, 2) + '\n');
}
console.log(report.join('\n'));
if (args.has('--pending')) {
  writeFileSync(join(ROOT, 'scripts', 'i18n', 'pending.tsv'), [...pending].map(([h, t]) => `${h}\t${t}`).join('\n') + '\n');
}
console.log(`Sin traducir: ${pending.size} frases únicas${args.has('--pending') ? ' → scripts/i18n/pending.tsv' : ''}`);
}
