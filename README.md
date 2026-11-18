# VECTRA — web corporativa

Web de **VECTRA · Soluciones Aéreas & Inspecciones Técnicas** (fotografía/vídeo aéreo para inmobiliarias e inspecciones técnicas con dron).
Publicada en **https://vectra-aerea.com** (también https://vectra-aerea.netlify.app).

Es un sitio **100 % estático**: HTML, CSS y JavaScript sin frameworks, sin build y sin dependencias. No hay `package.json`, ni servidor, ni base de datos.

---

## 1. Despliegue (cómo se publica)

| Pieza | Detalle |
|---|---|
| Alojamiento | **Netlify**, sitio `vectra-aerea` |
| Repositorio | GitHub `alcaidedev/vectra-web`, rama `main` |
| Flujo | editar → `git commit` → `git push origin main` → Netlify despliega solo en 30-60 s |
| Build | ninguno. Directorio de publicación: `/` (la raíz del repo) |
| Dominio | `vectra-aerea.com` configurado en Netlify |
| Formulario de contacto | Formspree (`https://formspree.io/f/mvzdopap`), enviado por `fetch` desde `contacto.html` |

Para ver los cambios en local basta cualquier servidor estático desde la raíz del repo (por ejemplo `python -m http.server`, o la extensión **Live Preview** de Microsoft en VS Code). Abrir los HTML con doble clic funciona casi todo, pero los vídeos y algunas rutas se comportan mejor con servidor.

> **Cuidado con git:** comprueba siempre con `git rev-parse --show-toplevel` que estás en la carpeta del repo antes de hacer `git add -A`. En el equipo del propietario hay otro repositorio git en la carpeta de usuario (`C:\Users\jojae`) con el mismo remoto, y un comando lanzado desde una carpeta equivocada puede afectar a ese.

---

## 2. Estructura

```
/
├── index.html        Portada
├── servicios.html    Servicios y precios
├── contacto.html     Contacto + formulario
├── styles.css        Todo el CSS (compartido por las 3 páginas)
├── main.js           Todo el JS (compartido)
├── _headers          Cabeceras de caché de Netlify
└── media/            Vídeos, imágenes y logo
```

Las tres páginas repiten el mismo bloque de **navegación, menú móvil y pie** (no hay plantillas ni includes). Si cambias el menú, el pie o el logo hay que hacerlo **en los 3 HTML**.

### `media/`
| Archivo | Uso |
|---|---|
| `green_field.mp4`, `castle_garden.mp4`, `construction_site.mp4`, `vineyard.mp4` | Vídeos de portada, versión **ligera** (720p, 8 s, 0,5–1,1 MB) |
| `*-hd.mp4` | Misma pieza en **1080p** (≈2,4 MB), solo para escritorio con red rápida |
| `poster.webp` | Imagen de portada: fondo mientras carga el vídeo y única opción en móvil |
| `inmo-1…4.webp` | Fotos inmobiliarias (galería de portada y tarjetas de Servicios) |
| `inspeccion-*.webp` | Fotos de inspecciones técnicas (finca, nave, teja, cubierta dañada) |
| `vectra-mark*.svg` | Logo (marca) en versión base, oscura y blanca; la oscura es el favicon |

---

## 3. Diseño

Sigue el estilo del dossier comercial de VECTRA (portada con marco blanco, titulares serif, marino + dorado sobre crema).

Todo se controla con variables CSS al principio de `styles.css`:

```css
--navy:#0A3048;   /* marino: títulos, bandas, botón principal */
--gold:#C9A04E;   /* dorado: acentos, números, precios */
--cream:#FCFAF6;  /* fondo */
--beige:#F6F1E7;  /* tarjetas */
--line:#E6DCC4;   /* filetes */
--gray:#6B7280;   /* texto secundario */
--serif:'Times New Roman',Tinos,Times,serif;
```

- **Tipografía:** Times New Roman con respaldo Tinos/Times. **No se carga ninguna fuente externa** a propósito (rendimiento y privacidad). Si se añade una web font, medir antes el impacto.
- **Componentes reutilizables** (clases en `styles.css`): `.head` (cabecera de sección con filetes), `.cols`/`.col` (columnas numeradas), `.callout` (banda marino), `.stat` (cifras), `.tier` y `.svc` (tarjetas de precios), `.gallery`, `.steps`, `.terms`, `.cta`, `.btn--gold/--ghost/--navy`.
- **Responsive:** dos puntos de ruptura, 1000 px y 640 px, al final de `styles.css`.
- **Animación de entrada:** clase `.reveal` + `IntersectionObserver` en `main.js`. Respeta `prefers-reduced-motion` y funciona sin JS (la clase `js` solo se añade si hay JS).
- **Logo:** se dibuja en línea con un `<symbol id="mark">` al inicio de cada HTML y se reutiliza con `<use href="#mark">`. El color del "hueco" interior se controla con la variable `--vectra-bg` (debe coincidir con el fondo donde se pone).

---

## 4. Vídeo de portada (`main.js`) — lo más delicado

Diseñado para que la web **no se ralentice ni consuma de más**:

1. El primer vídeo (`green_field.mp4`, ligero) va en el HTML con `poster` y arranca enseguida. Hay un segundo `<video>` vacío para el fundido cruzado.
2. Al terminar cada vídeo, se descarga el siguiente (rotación de 4, en bucle).
3. **Calidad adaptativa:** en cada cambio se mide la velocidad real de la última descarga (`PerformanceResourceTiming`). Se usa la versión `-hd` solo si la pantalla mide ≥1100 px y la descarga fue ≥10 Mbps (si ya se está en HD, se mantiene mientras haya ≥6 Mbps). Si no se puede medir (por ejemplo, recursos ya en caché), se queda en ligero.
4. **No se carga vídeo** (se queda solo el póster) en móvil (≤768 px), con ahorro de datos, conexión 2G/3G o "reducir movimiento".
5. El vídeo se **pausa** al salir de la portada o cambiar de pestaña.
6. Si un vídeo falla, salta al siguiente.

Para añadir o cambiar vídeos: editar el array `NAMES` en `main.js` y subir `nombre.mp4` y `nombre-hd.mp4` a `media/`.

### Cómo se generaron los vídeos (ffmpeg)
Originales en 4K en el equipo del propietario (no están en el repo). Comandos usados, partiendo de `ORIGEN` (4K) y cortando 8 s desde el segundo 2:

```bash
# Ligero 720p (~0,5–1,3 MB)
ffmpeg -y -ss 2 -i ORIGEN -t 8 -an -vf "scale=-2:720,fps=24" \
  -c:v libx264 -profile:v main -preset veryslow -crf 31 -maxrate 1200k -bufsize 2400k \
  -pix_fmt yuv420p -movflags +faststart nombre.mp4

# HD 1080p (~2,4 MB)
ffmpeg -y -ss 2 -i ORIGEN -t 8 -an -vf "scale=-2:1080:flags=lanczos,fps=24" \
  -c:v libx264 -profile:v high -preset veryslow -crf 28 -maxrate 2600k -bufsize 5200k \
  -pix_fmt yuv420p -movflags +faststart nombre-hd.mp4
```
(`green_field` ligero se codificó con `-crf 35 -maxrate 700k` por ser el primero en cargarse.) Se probó AV1: no compensaba en tamaño con estos clips, por eso solo hay H.264. Sin audio (`-an`) y con `faststart` para que arranque sin descargar el archivo entero.

### Imágenes
WebP con ancho máximo de 1000–1200 px (calidad 58–70) y atributos `width`/`height` en los `<img>` para evitar saltos de maquetación. Las de debajo del primer pantallazo llevan `loading="lazy"`. Ejemplo:

```bash
ffmpeg -i foto.jpg -vf "scale=1000:-2" -c:v libwebp -quality 58 -compression_level 6 foto.webp
```

---

## 5. Caché y rendimiento

`_headers` (lo lee Netlify):
- `/media/*` → 30 días · `styles.css` y `main.js` → 1 día · HTML → sin caché larga (valor por defecto de Netlify).
- **Consecuencia:** si **sustituyes** un archivo de `media/`, ponle **otro nombre** (o los visitantes seguirán viendo el antiguo hasta 30 días). Al cambiar `styles.css`/`main.js` puede tardar hasta 1 día en verse con caché; recarga forzada (Ctrl+F5) para comprobar.
- La carpeta `media/` pesa ≈14 MB, pero cada visitante solo descarga lo que usa (≈0,7 MB de vídeo al entrar en móvil/portátil lento: 0 MB en móvil).
- El coste de Netlify depende del ancho de banda: los vídeos son lo que más pesa. Antes de subir vídeos nuevos, mantenlos cortos y comprimidos como arriba.

---

## 6. Contenido y datos del negocio

- **Precios:** viven en `servicios.html` (no hay datos externos).
  - Foto/vídeo: 200 € / 300 € / 450 € + IVA, licencias (estándar incluida, ampliada +10 %) y descuentos (primer trabajo −10 %; 3–5 trabajos/mes −10 %; 6 o más −15 %; no acumulables). Salen del **dossier comercial** (`VECTRA_Dossier_Comercial`).
  - Inspecciones: precios "desde" por servicio, basados en la hoja interna de precios del negocio; el propietario debe confirmarlos antes de darlos por definitivos. Contrato anual de mantenimiento: −15 %.
- **Ámbito geográfico:** "Península Ibérica".
- **Contacto público:** `contacto@vectra-aerea.com`. **Actualmente no hay teléfono ni botón de WhatsApp** (se quitaron a petición del propietario hasta tener un número nuevo). Cuando haya uno, añadirlo en `contacto.html` (bloque `.c-item`) y, si se quiere, un botón flotante.
- **AESA:** el pie y la sección "Operativa legal y segura" dicen "Operador UAS registrado en AESA" **sin número de registro**. Se quitó el número de la página de contacto a petición del propietario; no volver a ponerlo sin consultar.
- **Textos que dependen de decisiones de negocio:** "respaldadas por una red de pilotos certificados" (subtítulo de *Qué hacemos*) y "Tarifa especial para inmobiliarias" (bandas de CTA).
- **Imágenes inmobiliarias (`inmo-*`)** las aportó el propietario. `inmo-4` es de menor resolución y parece llevar una marca de agencia en una esquina: confirmar derechos de uso.

---

## 7. SEO y accesibilidad (estado actual)

- Cada página tiene `<title>`, `meta description`, `theme-color` y favicon.
- Imágenes con `alt`, controles con `aria-label`, formulario con `label`, y mensajes de estado con `role="status"`.
- Formulario con campo trampa anti-spam (`_gotcha`) y validación mínima de nombre y email en cliente.

**Pendientes / ideas (no hechas):** `sitemap.xml`, `robots.txt`, etiquetas Open Graph para compartir en redes, datos estructurados (LocalBusiness), analítica (no hay ninguna; si se añade, valorar aviso de cookies/RGPD), páginas legales (aviso legal, privacidad: el formulario recoge datos personales y hoy no enlaza ninguna), imágenes de previsualización social, versión en otros idiomas.

---

## 8. Cosas que conviene no romper

1. Mantener los 3 HTML sincronizados (menú, pie, logo `<symbol>`).
2. No añadir fuentes ni librerías externas sin medir el impacto.
3. No subir vídeos sin comprimir (los originales de 4K pesan 100–170 MB).
4. No quitar `width`/`height` ni `loading="lazy"` de las imágenes.
5. Renombrar los archivos de `media/` cuando se sustituyan (caché de 30 días).
6. Probar en móvil real: el comportamiento del vídeo es distinto (solo póster).
