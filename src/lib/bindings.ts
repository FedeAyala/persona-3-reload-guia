// Enlaza atributos del HTML con el store, para que cualquier página pueda tener progreso
// sin escribir JS propio:
//
//   <label data-check="x:algo">…</label>      → checkbox (clase .checked)
//   <select data-bind="sl:magician">…</select> → valor guardado (también input / textarea)
//   <span data-count="tr:">0/0</span>          → "hechos/total" de los data-check con ese prefijo
//   <div data-count-bar="tr:"></div>           → barra (width en %)

import { store } from './store';

const checks = new Map<string, HTMLElement[]>();
const binds = new Map<string, (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]>();

function paintCheck(el: HTMLElement, on: boolean) {
  el.classList.toggle('checked', on);
  el.setAttribute('aria-checked', String(on));
  const box = el.querySelector<HTMLInputElement>('input[type=checkbox]');
  if (box) box.checked = on;
}

export function refreshCounts(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-count],[data-count-bar]').forEach((el) => {
    const prefix = el.dataset.count ?? el.dataset.countBar ?? '';
    const scope = el.dataset.countScope ? document.querySelector(el.dataset.countScope) ?? document : document;
    const all = [...scope.querySelectorAll<HTMLElement>('[data-check]')].filter((c) => c.dataset.check!.startsWith(prefix));
    const done = all.filter((c) => store.has(c.dataset.check!)).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    if (el.dataset.countBar != null) el.style.width = pct + '%';
    else el.textContent = el.dataset.countFormat === 'pct' ? `${pct}%` : `${done}/${all.length}${el.dataset.countFormat === 'full' ? ` (${pct}%)` : ''}`;
  });
}

export function bindAll(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-check]').forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    const key = el.dataset.check!;
    (checks.get(key) ?? checks.set(key, []).get(key)!).push(el);
    if (!el.hasAttribute('role')) el.setAttribute('role', 'checkbox');
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    paintCheck(el, store.has(key));
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a,button,select,textarea,input:not([type=checkbox])')) return;
      e.preventDefault();
      store.toggle(key);
    });
    el.addEventListener('keydown', (e) => {
      if (e.target !== el) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); store.toggle(key); }
    });
  });

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-bind]').forEach((el) => {
    if (el.dataset.bound) return;
    el.dataset.bound = '1';
    const key = el.dataset.bind!;
    (binds.get(key) ?? binds.set(key, []).get(key)!).push(el);
    const v = store.get(key);
    if (v != null) el.value = String(v);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const save = () => {
      const raw = el.value;
      store.set(key, el.dataset.type === 'number' ? (raw === '' ? null : Number(raw)) : raw);
    };
    if (el.tagName === 'TEXTAREA' || (el as HTMLInputElement).type === 'text') {
      el.addEventListener('input', () => { if (timer) clearTimeout(timer); timer = setTimeout(save, 600); });
      el.addEventListener('blur', () => { if (timer) { clearTimeout(timer); save(); } });
    } else el.addEventListener('change', save);
  });

  refreshCounts();
}

store.subscribe((changed) => {
  let anyCheck = false;
  for (const key of changed) {
    for (const el of checks.get(key) ?? []) { paintCheck(el, store.has(key)); anyCheck = true; }
    for (const el of binds.get(key) ?? []) {
      if (document.activeElement === el) continue;
      const v = store.get(key);
      el.value = v == null ? '' : String(v);
    }
  }
  if (anyCheck || changed.length > 20) refreshCounts();
});
