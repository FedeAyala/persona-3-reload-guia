# ⦿ Persona 3 Reload — Guía Completa

> Guía de walkthrough 100% en español para Persona 3 Reload, con progreso interactivo y sincronización en la nube.

![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?style=flat-square&logo=astro&logoColor=white)
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
| **Walkthrough día a día** | Cada acción, cada respuesta, cada decisión — de abril a enero |
| **Checkboxes con progreso** | Marcá lo que ya hiciste, barra de progreso por mes y total |
| **Sync en la nube** | Login con Google → tu progreso sincronizado en todos tus dispositivos |
| **Offline first** | Funciona sin internet, guarda en localStorage |
| **Respuestas de clase** | Todas las preguntas en clase y exámenes de mayo, julio y octubre |
| **Resumen mensual** | Vista calendario con jefes, fechas límite y metas por mes |
| **Social Links** | Respuestas rango a rango para los 22 arcanos |
| **Fusión de Personas** | Recetas clave y estrategias de fusión |
| **Guía de Tartarus** | Bloques, jefes y estrategias por piso |
| **Trofeos** | Checklist de los 50 trofeos con condiciones |

---

## Stack

```
Astro 5          →  framework estático, build ultra-rápido
Firebase Auth    →  Google Sign-In sin backend propio
Firestore        →  sincronización de progreso en la nube
Vite             →  bundler y HMR en desarrollo
CSS custom props →  design system con variables (--azure, --sky, --gold...)
Rajdhani + JetBrains Mono  →  tipografías (Google Fonts)
```

---

## Estructura del proyecto

```
persona3-reload-guia/
├── src/
│   ├── layouts/
│   │   └── Layout.astro          # Nav global, meta, fuentes
│   └── pages/
│       ├── index.astro            # Homepage
│       ├── walkthrough.astro      # Guía día a día + checkboxes + Firebase
│       ├── social-links.astro     # Los 22 vínculos sociales con respuestas
│       ├── fusion.astro           # Guía de fusión de Personas
│       ├── tartarus.astro         # Bloques y estrategias de Tartarus
│       ├── primera-partida.astro  # Tips para primera partida
│       ├── cien-por-ciento.astro  # Checklist 100%
│       ├── trofeos.astro          # Lista de trofeos
│       └── calendario.astro       # Redirect → /walkthrough
├── public/
│   └── styles/
│       └── global.css             # Design system completo
├── Guia/
│   └── 01.md … 24.md             # Fuente: walkthrough TenSquare3 (markdown)
├── astro.config.mjs
└── package.json
```

---

## Firebase — sincronización en la nube

El sitio usa Firebase para auth + guardado de progreso. Para correrlo localmente con tu propia instancia:

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

5. Reemplazá el `firebaseConfig` en `src/pages/walkthrough.astro` con tus credenciales

> Sin Firebase configurado, el sitio funciona igual pero el progreso solo se guarda localmente (localStorage).

---

## Deploy

El sitio está configurado para Netlify:

```bash
# Build command
astro build

# Publish directory
dist/
```

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
