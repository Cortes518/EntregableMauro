# Trabajo realizado: mundos-ia

Resumen de lo construido, cómo funciona, cómo se verificó cada parte y qué falta para entregar.

## 1. Cómo funciona

```
npm start -- "<situación>" "<mundo>" c1 c2 c3 c4 c5
        │
        ▼  index.js  (main async con try/catch)
Paso 0  process.loadEnvFile('.env')            → carga TEXTO_* e IMAGEN_*
Paso 1  mundo.crearMundo(args)                 → valida y crea { id, situacion, mundo, colores, creadoEn }
        mundo.guardarMundo(objeto)             → data/mundo_<id>.json
Paso 2  mundo.leerMundo(ruta)                  → vuelve a leer el JSON desde el archivo
        ¿existe descripciones/mundo_<id>.txt?  → sí: se reutiliza (no se llama a la API)
                                               → no: texto.describirMundo(mundo) → se guarda el .txt
Paso 3  se lee la descripción desde el .txt
        ¿existe imagenes/mundo_<id>.jpg?       → sí: se reutiliza (no se llama a la API)
                                               → no: imagen.generarImagen(descripcion) → bytes → .jpg
catch   explicarError(error)                   → mensaje en español + process.exitCode = 1
```

### Responsabilidad de cada módulo

| Archivo | Qué hace |
|---|---|
| `src/index.js` | Orquesta los pasos, decide si reutilizar archivos (`existsSync`), escribe el `.txt` y el `.jpg` y traduce los errores a mensajes en español (`explicarError`). |
| `src/mundo.js` | `crearMundo(args)` valida los 7 argumentos (cantidad, vacíos, colores distintos sin importar mayúsculas) y calcula el `id` con los primeros 8 caracteres de `object-hash` sobre `{ situacion, mundo, colores }`, sin la fecha. `guardarMundo` escribe el JSON con `JSON.stringify(objeto, null, 2)` y `leerMundo` lo lee con `readFileSync` + `JSON.parse`. |
| `src/texto.js` | `describirMundo(mundo)` hace un `fetch` POST en formato OpenAI con `JSON.stringify(mundo)` como mensaje de usuario y un mensaje de sistema propio (un párrafo en inglés de 80 a 120 palabras que describe una imagen, con los 5 colores y el estilo, sin markdown ni texto dentro de la imagen). Usa timeout de 30 s, revisa `respuesta.ok`, falla si la respuesta llega vacía y recorta a 1500 caracteres con aviso. |
| `src/imagen.js` | `generarImagen(descripcion)` hace un `fetch` GET a Pollinations (`IMAGEN_URL/<descripción con encodeURIComponent>?width=1024&height=1024&nologo=true`) con timeout de 60 s. Revisa `respuesta.ok`, que el `content-type` sea `image/*` y que los bytes no estén vacíos, y devuelve `Buffer.from(await respuesta.arrayBuffer())`. |

### Decisiones tomadas

- **Sistema de módulos: CommonJS** (`require` / `module.exports`) en todo el proyecto (`"type": "commonjs"`).
- **Servicios: Groq (texto) + Pollinations (imagen).** Se implementó primero NVIDIA FLUX.1-schnell, pero su endpoint de inferencia no respondió en las pruebas reales (ver sección 2), así que se cambió a Pollinations. El texto se cambia a NVIDIA o Pollinations solo editando el `.env`.
- **Rutas** construidas con `path.join(__dirname, '..', ...)`, así funciona desde cualquier carpeta.
- **Errores HTTP:** `texto.js` e `imagen.js` lanzan un `Error` con `status` y `retryAfter`, y `index.js` lo traduce en un solo lugar, sin repetir la lógica en los dos módulos.
- El mensaje de error indica **en qué paso** falló (`Error en el paso 2: ...`).
- Solo se usan herramientas de la sección 4: `fs` síncrono, `path`, `fetch`, `AbortSignal.timeout`, `process.loadEnvFile`, `Buffer.from` y `object-hash`.

## 2. Verificación de cada parte

Todas las pruebas se ejecutaron de verdad en este equipo (Windows 10, Node v24.18.0, npm 11.16.0).

| Parte | Requisito | Cómo se verificó | Resultado |
|---|---|---|---|
| 1 | Proyecto base, `.gitignore` con 5 entradas, `.env` fuera de Git | `npm start` y `git check-ignore .env node_modules` | ✅ |
| 2 | Exactamente 7 argumentos | 6 argumentos y 8 (sin comillas) | ✅ Mensaje con ejemplo de uso, `exit=1` |
| 2 | Ningún argumento vacío o solo espacios | `""` y `"   "` | ✅ `exit=1` |
| 2 | Colores distintos sin importar mayúsculas | `rojo` y `Rojo` | ✅ `exit=1` |
| 2 | Mismo id para los mismos datos | Mismo comando dos veces, en Bash y en PowerShell | ✅ Siempre `cba86145` |
| 2 | JSON con 5 campos y formato de 2 espacios | Lectura de `data/mundo_cba86145.json` | ✅ |
| 3 | Lee el JSON desde el archivo | `index.js` usa `leerMundo(rutaJson)` | ✅ |
| 3 | Llamada real al modelo de texto | Pollinations (mismo formato que Groq y NVIDIA, sin clave) | ✅ 104 palabras, inglés, 1 párrafo, 5 colores, estilo "digital concept art" |
| 4 | Imagen real | **Pollinations real**, dos mundos distintos | ✅ Dos `.jpg` válidos de 768×768 (JPEG), abiertos y revisados a mano |
| 4 | NVIDIA FLUX.1-schnell | Llamada real con tu clave (válida: el API de gestión responde 200 y el modelo figura `ACTIVE`) | ❌ El endpoint de inferencia acepta la conexión y no responde (60 s en el programa, 120 s con `curl`; igual con HTTP/1.1 y con su endpoint de texto). Es un problema del servicio, no del código. |
| 4 | Servicio caído (5xx) | Pollinations devolvió un 503 real y luego un servidor local con 503 | ✅ Mensaje claro "El servicio no esta disponible en este momento, espera un poco y intenta de nuevo", `exit=1`, y el reintento retoma desde el paso 3 |
| 5 | Reutiliza `.txt` y `.jpg` | Segunda ejecución del mismo comando | ✅ "ya existia, no se llamo..." |
| 5 | Resultados parciales | Se borró solo el `.jpg` | ✅ Reutilizó el `.txt` y solo generó la imagen |
| 5 | 401/403 | **Groq real** y **NVIDIA real** con clave falsa | ✅ "La API key no es valida, revisa tu archivo .env" |
| 5 | 404/410 | **NVIDIA real** con una URL de modelo inexistente | ✅ "El modelo o la URL no existen, revisa tu configuracion" |
| 5 | 402/429 | Servidor local con 429 y `retry-after: 12` | ✅ Incluye "pide esperar 12 segundos" |
| 5 | `TypeError` | Dominio mal escrito `api.groqq.comm` | ✅ "No se pudo conectar, revisa tu internet o la URL" |
| 5 | `TimeoutError` | Servidor local que nunca responde (30 s) | ✅ "El servicio tardo demasiado en responder, prueba de nuevo." |
| 5 | Falta el `.env` | Se renombró temporalmente | ✅ Mensaje que indica copiar `.env.example` |
| 5 | Las claves nunca se imprimen | `grep` de la clave en toda la salida de las pruebas | ✅ 0 apariciones |
| 6 | `npm publish --dry-run` limpio | Con `.gitignore` | ✅ 7 archivos, sin `.env` ni carpetas generadas |
| 6 | Experimento sin `.gitignore` | Renombrado a `.gitignore.off` y restaurado | ✅ Aparecen `.env`, `data/` y `descripciones/`, documentado en el README |

## 3. Commits

Un commit por parte (el enunciado pide al menos 6):

1. Parte 1: proyecto base
2. Parte 2: argumentos y JSON
3. Parte 3: modelo de texto
4. Parte 4: imagen
5. Parte 5: reutilización y errores
6. Parte 6: README y dry-run
7. PROMPT.md, evidencias y este archivo

## 4. Estado de la entrega

Hecho:

- [x] Clave de Groq en `.env` (la de NVIDIA ya no se usa).
- [x] Prueba real con varios mundos: las imágenes se generaron y se revisaron con el visor.
- [x] `PROMPT.md` y las respuestas de reflexión del README completados.

Falta (lo hace el aprendiz):

- [ ] Tomar las capturas de `evidencias/` (lista completa en la sección 6 del enunciado) y copiar las imágenes de `imagenes/` a `evidencias/`, porque `imagenes/` no se sube a Git.
- [ ] Hacer un commit con las evidencias y tomar la captura de `git ls-files` después de ese commit.
- [ ] Subir el repositorio a GitHub y reemplazar `<url-del-repositorio>` en el README.
- [ ] Prueba final: clonar el repositorio desde GitHub en otra carpeta, copiar `.env.example` a `.env`, ejecutar `npm install` y `npm start -- ...`.
- [ ] Revocar las claves de Groq y NVIDIA después de la sustentación (la de Groq se necesita para ejecutar en vivo).

### Para la sustentación: dónde tocar para los cambios típicos

| Cambio pedido | Dónde |
|---|---|
| 3 colores en vez de 5 | `mundo.js`: `args.length !== 7` → `5`, el mensaje y `EJEMPLO_USO`. `texto.js`: "five colors" → "three colors". |
| Agregar el campo `epoca` | `mundo.js`: leer un argumento más, agregarlo al objeto y al hash, y ajustar la cantidad. Llega solo al modelo porque se envía `JSON.stringify(mundo)`. Mencionarlo en `MENSAJE_SISTEMA`. |
| Estilo acuarela | `texto.js`: en `MENSAJE_SISTEMA`, pedir "watercolor painting style". Borrar el `.txt` y el `.jpg` de ese mundo para regenerarlos. |
| Cambiar el nombre del modelo | `.env` → `TEXTO_MODELO`. Si no existe, la API responde 404 y se muestra "El modelo o la URL no existen". |
| Borrar `imagenes/mundo_<id>.jpg` | La siguiente ejecución reutiliza el JSON y el `.txt` y solo vuelve a llamar al modelo de imágenes. |

## 5. Limitaciones conocidas

- `explicarError` trata cualquier `TypeError` como un problema de conexión, tal como indica el enunciado. Un error de programación de ese tipo también mostraría ese mensaje.
- En Windows PowerShell 5.1, un argumento vacío `""` no llega al programa. Esa validación se probó desde Git Bash.
- **Calidad de las imágenes de Pollinations:** la imagen del mundo `cba86145` (Aerópolis) salió con un cielo de tormenta en azul y violeta, pero sin la ciudad flotante y sin el rojo, el dorado ni el verde. La del mundo `ba39827a` (Ignaria) sí muestra el volcán, las lámparas naranjas y tonos rosados, pero tampoco el plateado ni el turquesa. El modelo gratuito no siempre respeta los 5 colores. Si quieres mejorarlo, borra el `.jpg` de ese mundo y vuelve a ejecutar: cada intento da un resultado distinto (espera 45 s entre imágenes).
- Pollinations deja una marca de agua `pollinations.ai` en la esquina de la imagen aunque se pide `nologo=true`.
- Pollinations permite 1 imagen cada 45 s por IP: si pides dos seguidas puede responder 402 (se muestra como "Superaste el límite gratuito") o un 503 transitorio, como ocurrió en una prueba.
