# El sol que me guía

Experiencia web romántica e interactiva: un cuento celestial de seis capítulos con cartas, un cuestionario, una escena a distancia, una promesa de futuro y una carta final con revelación progresiva. Es un regalo personal, estática y sin backend.

## Run & Operate

- `corepack enable` — deja `pnpm` disponible en la máquina.
- `pnpm install` — instala el workspace.
- `pnpm --filter @workspace/el-sol-que-me-guia run dev` — servidor de desarrollo. Requiere `PORT` y `BASE_PATH`; en Replit los define `.replit-artifact`.
- `pnpm --filter @workspace/el-sol-que-me-guia run build` — build de producción en `artifacts/el-sol-que-me-guia/dist/public`.
- `pnpm run typecheck` — typecheck de todo el workspace.

En PowerShell, antes de `dev` o `build`:

```powershell
$env:PORT="20224"; $env:BASE_PATH="/"
```

## Stack

- pnpm workspaces, React 19, Vite 7, TypeScript 5.9
- Tailwind CSS v4 + CSS propio para animaciones e ilustraciones
- Sin API, sin autenticación y sin base de datos

## Where things live

- `artifacts/el-sol-que-me-guia/src/content.ts` — **toda la personalización**: fechas, cartas, preguntas, promesas, carta final y ruta de la música.
- `artifacts/el-sol-que-me-guia/src/App.tsx` — experiencia y navegación por capítulos.
- `artifacts/el-sol-que-me-guia/src/index.css` — paleta oscura, animaciones y responsive.
- `artifacts/el-sol-que-me-guia/public/music.mp3` — «Novatos» de HUMBE, 2:28 (se carga solo al pulsar play).
- `artifacts/el-sol-que-me-guia/public/og-image.png` — imagen de vista previa al compartir el enlace.
- `artifacts/el-sol-que-me-guia/index.html` — título, metadatos y fuentes.

`artifacts/api-server`, `lib/db`, `lib/api-*`, `lib/api-client-react` y `artifacts/mockup-sandbox` son andamiaje de la plantilla de Replit. Esta experiencia no los usa.

## Architecture decisions

- Todo el contenido vive en un único objeto (`storyContent`) para que se pueda editar sin tocar componentes.
- No hay router: la experiencia es una máquina de estados con seis capítulos y navegación libre.
- El contador se calcula en vivo desde `relationshipStart` y muestra un estado especial si la fecha aún no llegó.
- La carta final se revela palabra a palabra y se divide en párrafos reales; el `aria-live` se mantiene apagado durante la animación.
- La app está marcada `noindex, nofollow` y `robots.txt` bloquea el rastreo: es un regalo privado, no una página pública.

## Product

1. Bienvenida con sobre que se abre.
2. Cartas para distintos estados de ánimo.
3. Cuestionario sin respuestas incorrectas.
4. Cielo compartido con línea de tiempo y contador.
5. Promesa de futuro.
6. Carta final, revelación progresiva y escena de cierre.

## User preferences

- Mantener la app estática: no añadir backend, autenticación ni base de datos.
- No inventar recuerdos, nombres ni frases personales.
- Paleta cósmica oscura inspirada en el álbum *ARMAGEDÓN* de HUMBE: carbón, naranja brasa, dorado y marfil.
- Emojis como acentos, sin saturar.

## Pending personal data

- `welcomeName` y `personalDetails` están vacíos.
- Las cartas y la carta final son borradores editables.
- Confirmar que `music.mp3` se puede publicar.
- Al publicar, cambiar `og:image` por una URL absoluta (`https://tu-dominio/og-image.png`).

## Gotchas

- Vite falla si faltan `PORT` o `BASE_PATH`.
- Si cambias el título, actualízalo también en `index.html`.
- El enlace de vista previa de WhatsApp necesita `og:image` con URL absoluta; en local queda relativa.
- No se ejecutan pruebas automatizadas: verificar a mano navegación, cartas, cuestionario, contador y carta final.
