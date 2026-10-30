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
| `src/imagen.js` | `generarImagen(descripcion)` hace un `fetch` POST a NVIDIA FLUX.1-schnell con timeout de 60 s. Revisa `respuesta.ok`, que exista `artifacts[0]`, que `finishReason` sea `SUCCESS` y que los bytes no estén vacíos, y devuelve `Buffer.from(base64, 'base64')`. |

### Decisiones tomadas

- **Sistema de módulos: CommonJS** (`require` / `module.exports`) en todo el proyecto (`"type": "commonjs"`).
- **Servicios: Groq (texto) + NVIDIA FLUX.1-schnell (imagen)**, la combinación sugerida del enunciado. El texto se cambia a NVIDIA o Pollinations solo editando el `.env`.
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
| 4 | Conversión base64 → bytes → `.jpg` | Servidor local con el formato exacto de NVIDIA, que devuelve un JPEG real | ✅ El `.jpg` guardado es **idéntico byte a byte** al original (`cmp`) |
| 4 | `finishReason` distinto de `SUCCESS` | Servidor local con `CONTENT_FILTERED` | ✅ Mensaje claro, `exit=1` |
| 4 | Bytes vacíos | Servidor local con base64 vacío | ✅ Mensaje claro, `exit=1` |
| 5 | Reutiliza `.txt` y `.jpg` | Segunda ejecución del mismo comando | ✅ "ya existía, no se llamó..." |
| 5 | Resultados parciales | Se borró solo el `.jpg` | ✅ Reutilizó el `.txt` y solo generó la imagen |
| 5 | 401/403 | **Groq real** y **NVIDIA real** con clave falsa | ✅ "La API key no es válida..." |
| 5 | 404/410 | **NVIDIA real** con una URL de modelo inexistente | ✅ "El modelo o la URL no existen..." |
| 5 | 402/429 | Servidor local con 429 y `retry-after: 12` | ✅ Incluye "pide esperar 12 segundos" |
| 5 | `TypeError` | Dominio mal escrito `api.groqq.comm` | ✅ "No se pudo conectar..." |
| 5 | `TimeoutError` | Servidor local que nunca responde (30 s) | ✅ "El servicio tardó demasiado..." |
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

## 4. Lo que falta y te toca a ti

- [ ] **Pegar tus claves reales en `.env`** (Groq `gsk_...` y NVIDIA `nvapi-...`). No las escribas en el chat ni en ningún otro archivo.
- [ ] **Primera prueba real con NVIDIA.** El formato de la respuesta se verificó con un servidor de prueba y el endpoint real respondió 401 con la clave falsa, pero falta una imagen real. Abre el `.jpg` con el visor de imágenes.
- [ ] **Ejecutar dos mundos distintos** y tomar las capturas para `evidencias/`. La lista completa está en la sección 6 del enunciado: dos ejecuciones, archivos generados, segunda ejecución, 3 errores, dry-run con y sin `.gitignore`, `git ls-files` y las dos imágenes.
- [ ] **Completar `PROMPT.md`:** secciones E (3 cambios tuyos) y F (una línea explicada con tus palabras) y la última fila de D.
- [ ] **Responder la pregunta 6 del README** con tu experiencia.
- [ ] Opcional: probar una descripción en español (pregunta 2) y comparar las imágenes.
- [ ] Prueba final: clonar el repositorio en otra carpeta, copiar `.env.example` a `.env`, ejecutar `npm install` y `npm start -- ...`.

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
