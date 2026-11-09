# ⦿ Persona 3 Reload — Guía Completa

> Guía de walkthrough 100% en español para Persona 3 Reload, con progreso interactivo y sincronización en la nube.

![Astro](https://img.shields.io/badge/Astro-4.x-FF5D01?style=flat-square&logo=astro&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth+Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Deploy](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)
![License](https://img.shields.io/badge/Licencia-MIT-blue?style=flat-square)

---

## ¿Qué es esto?

Un sitio web de guía para Persona 3 Reload construido con **Astro**, diseñado para jugadores hispanohablantes que quieren hacer una partida 100%. Incluye walkthrough día a día con checkboxes interactivos que se sincronizan entre dispositivos vía Google.

Basado en la guía de TenSquare3 (GameFAQs v2.5.0), adaptada y traducida al español con información adicional.

---

## Features

| Feature | Descripción |
|---|---|
| **Walkthrough día a día** | Los 288 días de abril a enero, traducidos de la guía de TenSquare3: cada acción, respuesta y decisión |
| **Checkboxes con progreso** | 1114 ítems tildables con progreso por día, por mes y total; "tildar todo el día" |
| **Panel "Hoy"** | Cargás la fecha en la que vas y muestra el próximo jefe, la próxima subida a Tartarus, los exámenes, los vínculos que suben y lo que te quedó pendiente |
| **Stats y Social Links** | Anotás tus rangos y la guía te avisa si vas atrasado respecto de la ruta |
| **Ruta de Social Links** | Los 22 arcanos rango a rango con fecha, acción y respuestas, generados del walkthrough |
| **Trofeos** | Los 48 logros en el orden en que salen, con checkbox y link al día |
| **Notas por día** | Un campo de notas propio en cada día, sincronizado |
| **Modo spoiler** | Oculta los días posteriores a tu fecha actual |
| **Buscador (Ctrl+K)** | Búsqueda en toda la guía con Pagefind; lleva directo al día |
| **Sync en la nube** | Login con Google → progreso en vivo entre dispositivos (también los destildados) |
| **Offline / instalable** | PWA con service worker: se instala en el celu y funciona sin conexión |
| **Pantalla encendida** | Botón para que el celu no se apague mientras jugás |

---

## Stack

```
Astro 4          →  sitio estático
Firebase Auth    →  Google Sign-In
Firestore        →  progreso en vivo (onSnapshot + escrituras parciales)
Pagefind         →  índice de búsqueda generado en el build
Service worker   →  offline + instalable
```

---

## Estructura del proyecto

```
persona3-reload-guia/
├── src/
│   ├── data/walkthrough/
│   │   ├── abril.json … enero.json   # Datos del walkthrough (un JSON por mes)
│   │   └── index.ts                  # Tipos, validación de ids y datos derivados (SL, trofeos, eventos)
│   ├── lib/
│   │   ├── store.ts                  # Estado del progreso (merge por clave + timestamp)
│   │   ├── sync.ts                   # Firebase (carga diferida)
│   │   └── bindings.ts               # data-check / data-bind / data-count en el HTML
│   ├── components/TodayPanel.astro   # Panel "Hoy"
│   ├── layouts/Layout.astro          # Nav, buscador, panel de progreso, PWA
│   └── pages/                        # walkthrough, social-links, trofeos, 100%, etc.
├── scripts/
│   ├── gen-walkthrough.mjs           # MD de TenSquare3 → JSON de junio a enero
│   └── i18n/                         # Patrones de traducción + traducciones (es/*.tsv)
├── public/
│   ├── styles/global.css, app.css
│   ├── sw.js, manifest.webmanifest, icons/
└── Guia/01.md … 24.md                # Fuente: walkthrough TenSquare3 (markdown)
```

### Editar el walkthrough

Los JSON de `src/data/walkthrough/` son la fuente de verdad. Cada ítem tildable tiene un `id` que **no hay que
cambiar ni reutilizar**: es la clave con la que se guarda el progreso. Para un ítem nuevo, inventá un id nuevo.
El build falla si hay ids repetidos.

`npm run gen` regenera junio–enero desde los MD (no pisa JSON existentes; `npm run gen -- --force` sí).
Con `--pending` lista las frases que todavía no tienen traducción.

---

## Firebase — sincronización en la nube

1. Creá un proyecto en [console.firebase.google.com](https://console.firebase.google.com)
2. Habilitá **Authentication → Google**
3. Creá una **Firestore Database** en modo producción
4. Configurá las reglas de Firestore:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /progress/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

5. Definí las variables `PUBLIC_FIREBASE_*` (API key, auth domain, project id, storage bucket, sender id, app id) en `.env` y en Netlify.

> Sin Firebase configurado, el sitio funciona igual y el progreso queda en el dispositivo.

---

## Deploy

Netlify corre `npm run build` (= `astro build && pagefind --site dist`) y publica `dist/`.
Si deployás en otro dominio, agregalo en Firebase Console → **Authentication → Settings → Authorized domains**.

---

## Design system

El sitio usa un sistema de variables CSS con paleta dark sci-fi:

```css
--azure:  #1F5EFF   /* azul primario */
--sky:    #4DA8FF   /* azul claro / acentos */
--gold:   #FFD166   /* dorado / advertencias */
--red:    #FF3A5C   /* peligro / jefes */
--green:  #2EFF9E   /* éxito / checkmarks */
--moon:   #C8D8FF   /* texto secundario */
--white:  #EEF3FF   /* texto primario */
--ink:    #05070F   /* fondo profundo */
--deep:   #080D1E   /* cards y superficies */
```

---

## Disclaimer

Este sitio es un proyecto de fan sin afiliación con Atlus, SEGA ni ninguna empresa relacionada con Persona 3 Reload. El contenido de la guía está basado en la guía de TenSquare3 disponible en GameFAQs, traducida y adaptada al español con fines no comerciales.

---

<div align="center">
  <sub>Hecho con demasiadas horas de Tartarus ⦿</sub>
</div>
