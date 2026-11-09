// Sincronización con Firebase (Google + Firestore). Se carga en diferido desde el Layout,
// así Firebase no frena la primera carga de ninguna página.
//
// Documento: progress/{uid} = { entries: { clave: {v, t} }, updatedAt }
// Escrituras: setDoc con merge → solo se mandan las claves que cambiaron.
// Lecturas: onSnapshot → los cambios de otro dispositivo llegan en vivo.

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { store, type Entries } from './store';

export type SyncState = { user: { name: string; photo: string | null } | null; status: string };
type Listener = (s: SyncState) => void;

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID,
};

const listeners = new Set<Listener>();
let state: SyncState = { user: null, status: config.apiKey ? 'Sin conectar' : 'Sync no configurado' };
const emit = (patch: Partial<SyncState>) => { state = { ...state, ...patch }; for (const fn of listeners) fn(state); };
export const onSync = (fn: Listener) => { listeners.add(fn); fn(state); return () => listeners.delete(fn); };

let signIn = async () => {};
let signOutFn = async () => {};
export const login = () => signIn();
export const logout = () => signOutFn();

if (config.apiKey) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  let user: User | null = null;
  let unsub: Unsubscribe | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let firstSnapshot = true;

  const push = async (keys: string[]) => {
    if (!user || !keys.length) return;
    const entries: Entries = {};
    for (const k of keys) if (store.entries[k]) entries[k] = store.entries[k];
    emit({ status: 'Guardando…' });
    try {
      await setDoc(doc(db, 'progress', user.uid), { entries, updatedAt: new Date().toISOString() }, { merge: true });
      for (const k of keys) store.dirty.delete(k);
      emit({ status: '✓ Sincronizado' });
    } catch (e) {
      console.error(e);
      emit({ status: navigator.onLine ? 'Error al guardar' : 'Sin conexión — se sube al volver' });
    }
  };
  const schedule = () => {
    if (!user) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => push([...store.dirty]), 1200);
  };
  store.onDirty = schedule;
  window.addEventListener('online', schedule);

  onAuthStateChanged(auth, (u) => {
    user = u;
    unsub?.();
    unsub = null;
    if (!u) { emit({ user: null, status: 'Sin conectar' }); return; }
    emit({ user: { name: u.displayName ?? u.email ?? '', photo: u.photoURL }, status: 'Conectando…' });
    firstSnapshot = true;
    unsub = onSnapshot(doc(db, 'progress', u.uid), (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      const data = snap.data() ?? {};
      const remote: Entries = { ...(data.entries ?? {}) };
      // formato viejo: { checked: [...] } → cuenta como tildado "antiguo"
      if (Array.isArray(data.checked)) for (const id of data.checked) if (!remote[`c:${id}`]) remote[`c:${id}`] = { v: 1, t: 1 };
      store.merge(remote, 'remote');
      if (firstSnapshot) {
        firstSnapshot = false;
        // subí lo local que la nube no tiene o tiene más viejo (cambios hechos offline o antes de loguear)
        const newer = Object.keys(store.entries).filter((k) => !remote[k] || store.entries[k].t > remote[k].t);
        if (newer.length) push(newer); else emit({ status: '✓ Sincronizado' });
      } else emit({ status: '✓ Sincronizado' });
    }, (e) => { console.error(e); emit({ status: 'Error de conexión' }); });
  });

  signIn = async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e: any) { if (e?.code !== 'auth/popup-closed-by-user') alert('Error al iniciar sesión: ' + (e?.message ?? e)); }
  };
  signOutFn = async () => { await signOut(auth); };
}
