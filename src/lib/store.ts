// Store de progreso del lado del cliente.
//
// Todo el estado es un mapa clave → { v: valor, t: timestamp }. Al combinar dos copias
// (local vs nube, o un import) gana el valor con el timestamp más nuevo, clave por clave.
// Así destildar en un dispositivo se propaga a los demás (antes la unión lo volvía a tildar).
//
// Claves:
//   c:<itemId>      checkbox del walkthrough (1 / 0)
//   tr:<n>          trofeo conseguido (1 / 0)
//   x:<id>          checkbox genérico de otras páginas (1 / 0)
//   n:<dayId>       nota propia del día (texto)
//   st:<stat>       rango de stat social (1-6)
//   sl:<arcana>     rango de social link (0-10)
//   cfg:date        fecha actual en el juego ("M/D")
//   cfg:spoilers    ocultar días futuros (1 / 0)

import LEGACY from '../data/legacy-ids.json';

export interface Entry { v: unknown; t: number }
export type Entries = Record<string, Entry>;

const KEY = 'p3r_state_v2';
const LEGACY_KEY = 'p3r_walkthrough_v1';

type Listener = (changed: string[], source: 'local' | 'remote') => void;

function safeGet(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* sin storage */ } }

function load(): Entries {
  const raw = safeGet(KEY);
  if (raw) { try { return JSON.parse(raw).entries ?? {}; } catch { /* corrupto */ } }
  // migración desde el formato viejo (array de ids tildados)
  const legacy = safeGet(LEGACY_KEY);
  const entries: Entries = {};
  if (legacy) {
    try { for (const id of JSON.parse(legacy) as string[]) entries[`c:${id}`] = { v: 1, t: 1 }; } catch { /* nada */ }
  }
  return entries;
}

class Store {
  entries: Entries = load();
  private listeners = new Set<Listener>();
  /** claves modificadas localmente que todavía no se subieron a la nube */
  dirty = new Set<string>();
  onDirty: (() => void) | null = null;
  private migrating = false;

  constructor() { this.migrateLegacy(); }

  get<T = unknown>(key: string, fallback?: T): T {
    const e = this.entries[key];
    return (e == null || e.v == null ? fallback : e.v) as T;
  }
  has(key: string) { const e = this.entries[key]; return !!e && !!e.v; }

  set(key: string, v: unknown) {
    this.entries[key] = { v, t: Date.now() };
    this.dirty.add(key);
    this.persist();
    this.emit([key], 'local');
    this.onDirty?.();
  }
  toggle(key: string) { this.set(key, this.has(key) ? 0 : 1); return this.has(key); }

  /** Combina entradas externas: gana la más nueva. Devuelve las claves que cambiaron. */
  merge(incoming: Entries, source: 'local' | 'remote' = 'remote'): string[] {
    const changed: string[] = [];
    for (const [k, e] of Object.entries(incoming)) {
      if (!e || typeof e.t !== 'number') continue;
      const cur = this.entries[k];
      if (!cur || e.t > cur.t) { this.entries[k] = e; changed.push(k); if (source === 'local') this.dirty.add(k); }
    }
    if (changed.length) { this.persist(); this.emit(changed, source); if (source === 'local') this.onDirty?.(); }
    if (changed.length && source === 'remote') this.migrateLegacy();
    return changed;
  }

  /**
   * Abril y mayo se regeneraron desde la guía y sus ítems tienen ids nuevos (src/data/legacy-ids.json).
   * Si un día viejo estaba todo tildado se tildan todos los ítems nuevos de ese día; si no, cada ítem
   * viejo tildado tilda los nuevos que lo reemplazan. Los ids viejos quedan con lápida para que la
   * nube (y otros dispositivos) converjan. Es idempotente: corre al cargar y después de cada merge remoto.
   */
  migrateLegacy() {
    if (this.migrating) return;
    const updates: Entries = {};
    const now = Date.now();
    for (const [olds, news, cover] of LEGACY as [string[], string[], Record<string, string[]>][]) {
      const checked = olds.filter((o) => this.has(`c:${o}`));
      if (!checked.length) continue;
      const t = Math.max(...checked.map((o) => this.entries[`c:${o}`].t));
      const targets = checked.length === olds.length ? news : checked.flatMap((o) => cover[o] ?? []);
      for (const n of targets) if (!this.entries[`c:${n}`]) updates[`c:${n}`] = { v: 1, t };
      for (const o of checked) updates[`c:${o}`] = { v: null, t: Math.max(now, this.entries[`c:${o}`].t + 1) };
    }
    if (!Object.keys(updates).length) return;
    this.migrating = true;
    try { this.merge(updates, 'local'); } finally { this.migrating = false; }
  }

  /** Borra todo: escribe "lápidas" con timestamp nuevo para que el borrado también se sincronice. */
  reset(prefixes?: string[]) {
    const now = Date.now();
    const keys = Object.keys(this.entries).filter((k) => !prefixes || prefixes.some((p) => k.startsWith(p)));
    for (const k of keys) { this.entries[k] = { v: null, t: now }; this.dirty.add(k); }
    this.persist();
    this.emit(keys, 'local');
    this.onDirty?.();
  }

  subscribe(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(changed: string[], source: 'local' | 'remote') { for (const fn of this.listeners) fn(changed, source); }
  private persist() { safeSet(KEY, JSON.stringify({ version: 2, entries: this.entries })); }

  export() { return { app: 'p3r-guia', version: 2, date: new Date().toISOString(), entries: this.entries }; }
  /** Acepta el formato nuevo ({entries}) y el viejo ({checked: [...]}) */
  import(data: any): number {
    if (data?.entries) return this.merge(data.entries, 'local').length;
    if (Array.isArray(data?.checked)) {
      const now = Date.now();
      return this.merge(Object.fromEntries(data.checked.map((id: string) => [`c:${id}`, { v: 1, t: now }])), 'local').length;
    }
    throw new Error('Formato no reconocido');
  }
}

// una sola instancia compartida entre todos los scripts de la página
const w = window as any;
export const store: Store = w.__p3rStore ?? (w.__p3rStore = new Store());

// sincroniza entre pestañas abiertas del mismo navegador
window.addEventListener('storage', (e) => {
  if (e.key !== KEY || !e.newValue) return;
  try { store.merge(JSON.parse(e.newValue).entries ?? {}, 'remote'); } catch { /* nada */ }
});

// ---------- fecha del juego ----------
export function dateOrd(date: string): number {
  const m = date?.match(/^(\d{1,2})\/(\d{1,2})/);
  if (!m) return -1;
  const mo = Number(m[1]), d = Number(m[2]);
  return (mo >= 4 ? mo - 4 : mo + 8) * 31 + d;
}
export const getGameDate = () => store.get<string>('cfg:date', '');
