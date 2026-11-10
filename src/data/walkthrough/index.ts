// Datos del walkthrough: un JSON por mes, generados con scripts/gen-walkthrough.mjs desde los MD
// de TenSquare3 (los "tips" de abril/mayo son propios y el generador los conserva).
//
// Reglas para editar los JSON:
// - Cada ítem tildable tiene un `id` único. NO lo cambies ni lo reutilices: es la clave con la
//   que se guarda tu progreso. Para un ítem nuevo inventá un id nuevo (ej. "junio-601-extra1").
// - Los ítems con `note: true` son notas sin checkbox.
// - `sub` son las respuestas / rangos / logros que cuelgan del ítem.

import abril from './abril.json';
import mayo from './mayo.json';
import junio from './junio.json';
import julio from './julio.json';
import agosto from './agosto.json';
import septiembre from './septiembre.json';
import octubre from './octubre.json';
import noviembre from './noviembre.json';
import diciembre from './diciembre.json';
import enero from './enero.json';

export interface Item { id?: string; text: string; sub?: string[]; note?: boolean }
export interface Slot { label: string; items: Item[] }
export interface Day { id: string; date: string; name: string; tips?: string[]; slots: Slot[] }
export interface Checklist {
  stats: { stat: string; rank: number; label: string }[];
  sl: { arcana: string; rank: number }[];
  trophies: string[];
  compendium: number;
}
export interface Month { key: string; short: string; num: number; title: string; intro: string[]; days: Day[]; checklist: Checklist | null }

const RAW: [string, string, number, any][] = [
  ['abril', 'ABR', 4, abril], ['mayo', 'MAY', 5, mayo], ['junio', 'JUN', 6, junio], ['julio', 'JUL', 7, julio],
  ['agosto', 'AGO', 8, agosto], ['septiembre', 'SEP', 9, septiembre], ['octubre', 'OCT', 10, octubre],
  ['noviembre', 'NOV', 11, noviembre], ['diciembre', 'DIC', 12, diciembre], ['enero', 'ENE', 1, enero],
];

export const MONTHS: Month[] = RAW.map(([key, short, num, d]) => ({ key, short, num, ...d }));

// ---------- fechas del juego ----------
/** Orden cronológico de una fecha "M/D" dentro del año escolar (abril → enero). */
export function dateOrd(date: string): number {
  const m = date.match(/^(\d{1,2})\/(\d{1,2})/);
  if (!m) return -1;
  const mo = Number(m[1]), d = Number(m[2]);
  const idx = mo >= 4 ? mo - 4 : mo + 8;
  return idx * 31 + d;
}
export const MONTH_NAMES: Record<number, string> = { 1: 'enero', 4: 'abril', 5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto', 9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre' };
export function formatDate(date: string): string {
  const [m, d] = date.split('/').map(Number);
  return `${d} de ${MONTH_NAMES[m] ?? m}`;
}

// ---------- validación (corre en el build: si hay ids repetidos, falla) ----------
const ALL_IDS = new Set<string>();
for (const m of MONTHS) for (const d of m.days) for (const s of d.slots) for (const it of s.items) {
  if (it.note) continue;
  if (!it.id) throw new Error(`Ítem sin id en ${m.key} ${d.date}: ${it.text.slice(0, 60)}`);
  if (ALL_IDS.has(it.id)) throw new Error(`Id repetido en el walkthrough: ${it.id}`);
  ALL_IDS.add(it.id);
}
export const TOTAL_ITEMS = ALL_IDS.size;

/** Lista plana de días con su mes, en orden. */
export const DAYS = MONTHS.flatMap((m) => m.days.map((d) => ({ month: m.key, ...d, ord: dateOrd(d.date) })));

const strip = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

// ---------- respuestas de clase / exámenes ----------
export interface ClassAnswer { date: string; dayId: string; answer: string; exam: boolean }
export const CLASS_ANSWERS: ClassAnswer[] = [];
for (const d of DAYS) {
  for (const s of d.slots) {
    for (const it of s.items) {
      const t = strip(it.text);
      const m = t.match(/^Respuesta(?: en clase| de examen)?:\s*(.+)$/i);
      if (m) CLASS_ANSWERS.push({ date: d.date, dayId: d.id, answer: (m[1].match(/^"[^"]*"/)?.[0] ?? m[1]).replace(/\s*\(?(Encanto|Académicos|Valentía) \+\d\)?.*$/, '').trim(), exam: /Examen/i.test(s.label) || /examen/i.test(d.name) });
    }
  }
}
// marca como examen las semanas de exámenes conocidas
const EXAM_RANGES = [['5/18', '5/22'], ['7/14', '7/18'], ['10/13', '10/17'], ['12/14', '12/18']];
for (const a of CLASS_ANSWERS) if (EXAM_RANGES.some(([x, y]) => dateOrd(a.date) >= dateOrd(x) && dateOrd(a.date) <= dateOrd(y))) a.exam = true;

// ---------- Social Links ----------
export const ARCANA = [
  { key: 'fool', name: 'Fool', who: 'SEES', alias: ['Fool'] },
  { key: 'magician', name: 'Magician', who: 'Kenji Tomochika', alias: ['Magician'] },
  { key: 'priestess', name: 'Priestess', who: 'Fuuka Yamagishi', alias: ['Priestess'] },
  { key: 'empress', name: 'Empress', who: 'Mitsuru Kirijo', alias: ['Empress'] },
  { key: 'emperor', name: 'Emperor', who: 'Hidetoshi Odagiri', alias: ['Emperor'] },
  { key: 'hierophant', name: 'Hierophant', who: 'Bunkichi y Mitsuko', alias: ['Hierophant'] },
  { key: 'lovers', name: 'Lovers', who: 'Yukari Takeba', alias: ['Lovers'] },
  { key: 'chariot', name: 'Chariot', who: 'Kazushi Miyamoto', alias: ['Chariot'] },
  { key: 'justice', name: 'Justice', who: 'Chihiro Fushimi', alias: ['Justice'] },
  { key: 'hermit', name: 'Hermit', who: 'Maya (Innocent Sin Online)', alias: ['Hermit'] },
  { key: 'fortune', name: 'Fortune', who: 'Keisuke Hiraga', alias: ['Fortune'] },
  { key: 'strength', name: 'Strength', who: 'Yuko Nishiwaki', alias: ['Strength'] },
  { key: 'hanged', name: 'Hanged Man', who: 'Maiko Oohashi', alias: ['Hanged', 'Hanged Man'] },
  { key: 'death', name: 'Death', who: 'Pharos', alias: ['Death'] },
  { key: 'temperance', name: 'Temperance', who: 'Bebe (André Laurent Jean Geraux)', alias: ['Temperance', 'Temperence'] },
  { key: 'devil', name: 'Devil', who: 'Presidente Tanaka', alias: ['Devil'] },
  { key: 'tower', name: 'Tower', who: 'Mutatsu', alias: ['Tower'] },
  { key: 'star', name: 'Star', who: 'Mamoru Hayase', alias: ['Star'] },
  { key: 'moon', name: 'Moon', who: 'Nozomi Suemitsu', alias: ['Moon'] },
  { key: 'sun', name: 'Sun', who: 'Akinari Kamiki', alias: ['Sun'] },
  { key: 'judgement', name: 'Judgement', who: 'SEES', alias: ['Judgement', 'Judgment'] },
  { key: 'aeon', name: 'Aeon', who: 'Aigis', alias: ['Aeon'] },
];
const ALIAS = new Map(ARCANA.flatMap((a) => a.alias.map((x) => [x.toLowerCase(), a.key] as const)));
const RANK_RE = /\b(Fool|Magician|Priestess|Empress|Emperor|Hierophant|Lovers|Chariot|Justice|Hermit|Fortune|Strength|Hanged(?: Man)?|Death|Temperen?ce|Temperance|Devil|Tower|Star|Moon|Sun|Judge?ment|Aeon)\s+Rango\s+(\d+|MAX)\b/gi;

export interface RankUp { arcana: string; rank: number; date: string; dayId: string; itemId?: string; action: string; answers: string[] }
export const SL_ROUTE: Record<string, RankUp[]> = Object.fromEntries(ARCANA.map((a) => [a.key, []]));
for (const d of DAYS) {
  for (const s of d.slots) {
    for (const it of s.items) {
      if (it.note) continue;
      const all = [it.text, ...(it.sub ?? [])].join(' \n ');
      for (const m of strip(all).matchAll(RANK_RE)) {
        const key = ALIAS.get(m[1].toLowerCase()) ?? ALIAS.get(m[1].toLowerCase().replace(/ man$/, ''));
        if (!key) continue;
        const rank = /max/i.test(m[2]) ? 10 : Number(m[2]);
        const list = SL_ROUTE[key];
        if (list.some((r) => r.rank === rank)) continue;
        const action = strip(it.text).replace(/→.*$/, '').replace(/:\s*$/, '').trim();
        const answers = (it.sub ?? []).map(strip).filter((x) => !RANK_RE.test(x) && !/Logro\/Trofeo/.test(x));
        RANK_RE.lastIndex = 0;
        // respuestas inline del formato abril/mayo: "Salir con X: "a (+3)", "b (+1)" → Rango N"
        const inline = strip(it.text).match(/"[^"]+"/g) ?? [];
        list.push({ arcana: key, rank, date: d.date, dayId: d.id, itemId: it.id, action: action.split(':')[0], answers: answers.length ? answers : inline });
      }
    }
  }
}
for (const k in SL_ROUTE) SL_ROUTE[k].sort((a, b) => a.rank - b.rank || dateOrd(a.date) - dateOrd(b.date));

/** Rango esperado de cada arcano a una fecha dada según la ruta de la guía. */
export function expectedRanks(ord: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k in SL_ROUTE) out[k] = SL_ROUTE[k].filter((r) => dateOrd(r.date) <= ord).reduce((a, r) => Math.max(a, r.rank), 0);
  return out;
}

// ---------- stats sociales esperadas por fecha (rangos que la guía marca al subir) ----------
export const STATS = [
  { key: 'academics', name: 'Académicos', en: 'Academics', max: 6 },
  { key: 'charm', name: 'Encanto', en: 'Charm', max: 6 },
  { key: 'courage', name: 'Valentía', en: 'Courage', max: 6 },
];
export const STAT_RANKUPS: { stat: string; rank: number; date: string; dayId: string }[] = [];
for (const d of DAYS) for (const s of d.slots) for (const it of s.items) {
  for (const m of strip([it.text, ...(it.sub ?? [])].join(' ')).matchAll(/\((Académicos|Encanto|Valentía) Rango (\d)\)/g)) {
    // la guía marca las subidas como "(Encanto Rango 4)"; "(Requiere Encanto Rango 4)" o un texto que
    // menciona el rango es un requisito, no una subida
    const st = STATS.find((x) => x.name === m[1])!;
    const rank = Number(m[2]);
    if (!STAT_RANKUPS.some((r) => r.stat === st.key && r.rank === rank)) STAT_RANKUPS.push({ stat: st.key, rank, date: d.date, dayId: d.id });
  }
}
// completa con los checklists de fin de mes (garantiza el mínimo a fin de cada mes)
for (const m of MONTHS) {
  if (!m.checklist) continue;
  const last = m.days[m.days.length - 1];
  for (const s of m.checklist.stats) {
    const st = STATS.find((x) => x.en === s.stat);
    if (st && !STAT_RANKUPS.some((r) => r.stat === st.key && r.rank >= s.rank)) STAT_RANKUPS.push({ stat: st.key, rank: s.rank, date: last.date, dayId: last.id });
  }
}
export function expectedStats(ord: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const st of STATS) out[st.key] = STAT_RANKUPS.filter((r) => r.stat === st.key && dateOrd(r.date) <= ord).reduce((a, r) => Math.max(a, r.rank), 1);
  return out;
}

// ---------- trofeos ----------
export interface Trophy { n: number; name: string; date: string; dayId: string; condition?: string; context: string }
const TROPHY_MAP = new Map<string, Trophy>();
for (const d of DAYS) for (const s of d.slots) for (const it of s.items) {
  for (const line of [it.text, ...(it.sub ?? [])].map(strip)) {
    const m = line.match(/(?:Logro\/Trofeo|Trofeo):\s*(.+?)\s*(?:\(([^)]*)\)\s*)?\((\d+)\/48\)\s*(?:\(([^)]*)\))?/);
    if (!m) continue;
    const n = Number(m[3]);
    if (TROPHY_MAP.has(String(n))) continue;
    TROPHY_MAP.set(String(n), { n, name: m[1].replace(/\s+🏆$/, ''), date: d.date, dayId: d.id, condition: m[4] ?? m[2], context: strip(it.text).replace(/^🏆\s*/, '') });
  }
}
// respaldo por si algún logro no aparece con el contador (n/48) en el texto
const EARLY: [number, string, string, string?][] = [
  [1, 'Awakened Power', '4/9'], [2, 'SEES the Day', '4/18'], [3, 'The First of Many', '4/22'],
  [4, 'There’s No “I” in “Team”', '4/22'], [5, 'The Thrill of the Hunt', '4/22'],
  [6, 'Shrouded Assassin', '4/22', '50 emboscadas'], [7, 'Making the Dream Work', '4/22', '50 All-Out Attacks'],
  [8, 'The Power of Choice', '4/22', 'conseguí 10 Personas en Shuffle Time'], [9, 'Back on Track', '5/9'],
  [10, 'Gourmand', '5/14'], [11, 'Briefcase Burglar', '5/24', 'abrí 50 cofres'], [12, 'Top of the Class', '5/25'],
  [13, 'Eagle Eye', '5/25'], [48, 'From Shadows into Light', '1/31', 'terminá el juego y el epílogo'],
];
for (const [n, name, date, condition] of EARLY) {
  if (!TROPHY_MAP.has(String(n))) TROPHY_MAP.set(String(n), { n, name, date, dayId: dayIdFor(date) ?? '', condition, context: '' });
}
export const TROPHIES: Trophy[] = [...TROPHY_MAP.values()].sort((a, b) => a.n - b.n);

// ---------- eventos clave ----------
export type EventKind = 'boss' | 'exam' | 'tartarus' | 'deadline' | 'story';
export interface GameEvent { date: string; end?: string; kind: EventKind; title: string; detail?: string }
export const EVENTS: GameEvent[] = [
  { date: '4/9', kind: 'boss', title: 'Luna llena: Magician', detail: 'Primer arcano mayor, en el dormitorio' },
  { date: '4/22', kind: 'tartarus', title: 'Tartarus: Thebel hasta 22F', detail: 'Primer bloque completo en una noche' },
  { date: '5/9', kind: 'boss', title: 'Luna llena: Priestess', detail: 'Valkyrie es muy útil' },
  { date: '5/18', end: '5/22', kind: 'exam', title: 'Exámenes de mayo' },
  { date: '5/24', kind: 'tartarus', title: 'Tartarus: Arqa hasta 44F', detail: 'Necesitás ~125k para las fusiones' },
  { date: '6/8', kind: 'boss', title: 'Luna llena: Empress y Emperor', detail: 'En el colegio de noche' },
  { date: '7/2', kind: 'tartarus', title: 'Tartarus: Arqa 2 hasta 69F', detail: 'Rescates de personas perdidas' },
  { date: '7/7', kind: 'boss', title: 'Luna llena: Hierophant y Lovers', detail: 'Ascetic Charm + Dis-Charm; dejá a Mitsuru afuera' },
  { date: '7/14', end: '7/18', kind: 'exam', title: 'Exámenes de julio' },
  { date: '8/3', kind: 'tartarus', title: 'Tartarus: Yabbashah 1 hasta 92F' },
  { date: '8/6', kind: 'boss', title: 'Luna llena: Chariot y Justice', detail: 'Bajo tierra' },
  { date: '9/4', kind: 'tartarus', title: 'Tartarus: Yabbashah 2 hasta 118F', detail: 'Carta Devil en el Monad Passage del 117F' },
  { date: '9/5', kind: 'boss', title: 'Luna llena: Hermit', detail: 'Yukari y Aigis son débiles al rayo' },
  { date: '10/1', kind: 'tartarus', title: 'Tartarus: Tziah 1 hasta 144F', detail: '⚠️ No te pierdas los rescates: bloquean un vínculo' },
  { date: '10/4', kind: 'boss', title: 'Luna llena: Fortune y Strength', detail: 'Sin Shinjiro ni Ken' },
  { date: '10/13', end: '10/17', kind: 'exam', title: 'Exámenes de octubre' },
  { date: '10/30', kind: 'tartarus', title: 'Tartarus: Tziah 2 hasta 172F', detail: '⚠️ No te pierdas los rescates: bloquean un vínculo' },
  { date: '11/3', kind: 'boss', title: 'Luna llena: Hanged Man', detail: 'Último arcano mayor: varias peleas seguidas' },
  { date: '11/17', end: '11/19', kind: 'story', title: 'Viaje escolar a Kioto' },
  { date: '11/22', kind: 'boss', title: 'Hora Oscura: pelea contra el jefe' },
  { date: '12/1', kind: 'tartarus', title: 'Tartarus: Harabah 1 hasta 198F' },
  { date: '12/14', end: '12/18', kind: 'exam', title: 'Exámenes finales' },
  { date: '12/24', kind: 'story', title: 'Nochebuena', detail: 'Comprá el regalo antes' },
  { date: '12/30', kind: 'tartarus', title: 'Tartarus: Harabah 2 hasta 226F' },
  { date: '12/31', kind: 'story', title: 'La decisión', detail: 'Define el final: guardá antes si querés ver el malo' },
  { date: '1/10', kind: 'tartarus', title: 'Tartarus: Adamah hasta 256F', detail: 'Farmeo de endgame con el Arcano Devil' },
  { date: '1/31', kind: 'boss', title: 'Jefe final', detail: 'Registrá todas tus Personas antes' },
];

/** Busca el id del día del walkthrough más cercano (igual o anterior) a una fecha. */
export function dayIdFor(date: string): string | undefined {
  const o = dateOrd(date);
  let best: (typeof DAYS)[number] | undefined;
  for (const d of DAYS) if (d.ord <= o && (!best || d.ord >= best.ord)) best = d;
  return best?.id;
}

// ---------- Tartarus ----------
export interface TartarusVisit { date: string; dayId: string; floor: number; area: string; items: (Item & { slot: string })[] }
export const TARTARUS_BLOCKS = [
  { name: 'Thebel', floors: '1F–22F', months: 'Abril', note: 'Bloque tutorial. La guía lo sube entero en una sola noche.' },
  { name: 'Arqa', floors: '23F–68F', months: 'Mayo – julio', note: 'Aparecen las Formidable Shadows (30F) y la interferencia de Fuuka (57F).' },
  { name: 'Yabbashah', floors: '69F–118F', months: 'Agosto – septiembre', note: 'Primer Monad Passage en el 91F. Carta Devil en el 117F.' },
  { name: 'Tziah', floors: '119F–172F', months: 'Octubre', note: 'Greedy Shadows y Dark Zones. Rescates que bloquean vínculos si se pierden.' },
  { name: 'Harabah', floors: '173F–226F', months: 'Diciembre', note: 'Cartas Sun y Judgement en el Monad Passage del 225F.' },
  { name: 'Adamah', floors: '227F–256F', months: 'Enero', note: 'Último bloque y farmeo de endgame. La puerta del 255F lleva al jefe secreto.' },
];
const TART_RE = /\b\d{1,3}F\b|guardi[aá]n|Monad|piso frontera|Greedy|Dark Zone|Reaper|rescat|Tartarus|Shuffle Time|Arcano Mayor|Arcana Burst|cofre/i;
export const TARTARUS_VISITS: TartarusVisit[] = EVENTS.filter((e) => e.kind === 'tartarus').map((e) => {
  const day = DAYS.find((d) => d.date === e.date)!;
  const floor = Number(e.title.match(/(\d+)F/)?.[1] ?? 0);
  const items = day.slots.flatMap((s) => s.items.map((i) => ({ ...i, slot: s.label }))).filter((i) => !i.text.includes('<table') && TART_RE.test(strip(i.text)));
  return { date: e.date, dayId: day.id, floor, area: e.title.replace(/^Tartarus:\s*/, ''), items };
});

// ---------- Fusiones ----------
export interface FusionSession { date: string; dayId: string; month: string; items: (Item & { slot: string })[] }
const FUS_RE = /Velvet Room|[Ff]usion|[Ff]usión|[Ff]usioná|Invocá|Liberá|Enseñale|Personas que tenés que llevar|Personas DLC|compendio|Theurgy|Heart Item|Growth|Lovers/;
export const FUSION_SESSIONS: FusionSession[] = DAYS.filter((d) => d.slots.some((s) => s.items.some((i) => i.text.includes("<table") && i.text.includes("Receta de fusión")))).map((d) => ({
  date: d.date,
  dayId: d.id,
  month: d.month,
  items: d.slots.flatMap((s) => s.items.map((i) => ({ ...i, slot: s.label }))).filter((i) => i.text.includes('<table') || FUS_RE.test(strip(i.text))),
}));

// ---------- Encargos de Elizabeth (scripts/gen-elizabeth.mjs) ----------
import elizabethRaw from '../elizabeth.json';
export interface Quest { n: number; name: string; accepted: string | null; done: string | null; acceptedDay?: string; doneDay?: string }
export const QUESTS: Quest[] = (elizabethRaw as Quest[]).map((q) => ({
  ...q,
  acceptedDay: q.accepted ? dayIdFor(q.accepted) : undefined,
  doneDay: q.done ? dayIdFor(q.done) : undefined,
}));

// ---------- Equipo recomendado (tablas Arma/Armadura/Calzado/Accesorio de la guía) ----------
export interface GearTable { date: string; dayId: string; html: string }
export const GEAR_TABLES: GearTable[] = DAYS.flatMap((d) => d.slots.flatMap((s) => s.items
  .filter((i) => i.note && i.text.includes('<table') && /Arma<\/strong>.*Armadura<\/strong>/.test(i.text))
  .map((i) => ({ date: d.date, dayId: d.id, html: i.text }))));
