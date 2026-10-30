# mundos-ia

Programa de consola en Node.js que crea bocetos visuales de mundos imaginarios para un estudio de videojuegos:

1. Recibe por parámetros una **situación**, un **mundo** y **5 colores**, y los guarda en `data/mundo_<id>.json`.
2. Lee ese JSON y se lo envía a un **modelo de lenguaje** para que escriba la descripción de una imagen. La guarda en `descripciones/mundo_<id>.txt`.
3. Envía esa descripción a un **modelo de imágenes** y guarda la imagen en `imagenes/mundo_<id>.jpg`.

Si se repite el mismo comando, no se vuelve a llamar a ninguna API: se reutilizan los archivos ya generados.

## Requisitos

- Node.js 20.12 o superior (`node -v`), npm y Git.
- Una clave del servicio de texto y una del servicio de imágenes (ver [Servicios](#servicios-elegidos)).

## Instalación y configuración

```bash
git clone <url-del-repositorio>
cd mundos-ia
npm install
```

Copia `.env.example` a `.env` y reemplaza `pega_aqui_tu_clave` por tus claves reales:

```bash
cp .env.example .env
```

```
TEXTO_API_KEY=pega_aqui_tu_clave
TEXTO_URL=https://api.groq.com/openai/v1/chat/completions
TEXTO_MODELO=openai/gpt-oss-20b
IMAGEN_API_KEY=pega_aqui_tu_clave
IMAGEN_URL=https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell
```

El archivo `.env` **nunca** se sube a Git (está en el `.gitignore`).

## Uso

```bash
npm start -- "<situación>" "<mundo>" <color1> <color2> <color3> <color4> <color5>
```

Ejemplo:

```bash
npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta
```

Las comillas son necesarias: sin ellas cada palabra llega como un argumento distinto. El doble guion `--` le indica a npm que lo que sigue son argumentos del programa.

Salida:

```
Paso 1: mundo guardado en data/mundo_cba86145.json
Paso 2: descripción guardada en descripciones/mundo_cba86145.txt
Paso 3: imagen guardada en imagenes/mundo_cba86145.jpg
Listo. Revisa la carpeta imagenes/
```

Segunda ejecución del mismo comando:

```
Paso 1: mundo guardado en data/mundo_cba86145.json
Paso 2: la descripción ya existía, no se llamó al modelo de texto.
Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.
Listo. Revisa la carpeta imagenes/
```

### Validaciones de los parámetros

- Deben llegar exactamente 7 argumentos.
- Ningún argumento puede estar vacío ni tener solo espacios.
- Los 5 colores deben ser distintos (sin distinguir mayúsculas de minúsculas).

Si algo falla se muestra un mensaje en español con un ejemplo de uso y el programa termina con `process.exitCode = 1`.

### Errores explicados

| Situación | Mensaje |
|---|---|
| Estado 401 o 403 | La API key no es válida. Revisa tu archivo .env. |
| Estado 402 o 429 | Superaste el límite gratuito. Espera un momento e intenta de nuevo. (Si existe, se indica el `retry-after`.) |
| Estado 404 o 410 | El modelo o la URL no existen. Revisa tu configuración. |
| `fetch` lanza `TypeError` | No se pudo conectar. Revisa tu internet o la URL. |
| `TimeoutError` | El servicio tardó demasiado en responder. Intenta de nuevo. |
| No existe `.env` | No se encontró el archivo .env. Copia .env.example a .env y pon tus claves. |

Si un paso falla, los archivos de los pasos anteriores se conservan y la siguiente ejecución continúa desde donde quedó.

## Estructura

```
mundos-ia/
├── src/
│   ├── index.js     # orquesta los pasos 1 a 3 y explica los errores
│   ├── mundo.js     # valida los argumentos, crea el objeto y lo guarda o lee (JSON)
│   ├── texto.js     # consulta al modelo de lenguaje (fetch)
│   └── imagen.js    # consulta al modelo de imágenes (fetch) y devuelve los bytes
├── data/            # mundo_<id>.json      (generado, no va a Git)
├── descripciones/   # mundo_<id>.txt       (generado, no va a Git)
├── imagenes/        # mundo_<id>.jpg       (generado, no va a Git)
├── evidencias/      # capturas de pantalla de la entrega
├── .env             # tus claves (NO va a Git)
├── .env.example
├── .gitignore
├── package.json
├── PROMPT.md
└── README.md
```

Herramientas usadas: CommonJS (`require` / `module.exports`), módulos nativos `fs` y `path`, `fetch` nativo con `AbortSignal.timeout`, `process.loadEnvFile` y un único paquete externo: [`object-hash`](https://www.npmjs.com/package/object-hash).

## Servicios elegidos

| Uso | Servicio | Enlaces |
|---|---|---|
| Texto | **Groq**, modelo `openai/gpt-oss-20b` (formato compatible con OpenAI) | [Crear clave](https://console.groq.com/keys) · [Modelos](https://console.groq.com/docs/models) · [Límites](https://console.groq.com/docs/rate-limits) |
| Imagen | **NVIDIA FLUX.1-schnell** (la imagen llega en base64 dentro de un JSON) | [Página del modelo](https://build.nvidia.com/black-forest-labs/flux_1-schnell) |

El servicio de texto se puede cambiar solo editando el `.env`: NVIDIA (`https://integrate.api.nvidia.com/v1/chat/completions`) y Pollinations (`https://text.pollinations.ai/openai`, modelo `openai`) usan el mismo formato.

## Experimento: `npm publish --dry-run` con y sin `.gitignore`

**Con `.gitignore`** (7 archivos, ningún dato privado):

```
npm notice 236B .env.example
npm notice 133B README.md
npm notice 496B package.json
npm notice 2.0kB src/imagen.js
npm notice 3.7kB src/index.js
npm notice 2.4kB src/mundo.js
npm notice 2.8kB src/texto.js
npm notice total files: 7
```

**Sin `.gitignore`** (renombrado a `.gitignore.off`, 12 archivos):

```
npm notice 236B .env                          <-- ¡las claves!
npm notice 236B .env.example
npm notice 50B .gitignore.off
npm notice 133B README.md
npm notice 288B data/mundo_ba39827a.json
npm notice 297B data/mundo_cba86145.json
npm notice 708B descripciones/mundo_cba86145.txt
npm notice 496B package.json
npm notice 2.0kB src/imagen.js
...
npm notice total files: 12
```

**Qué pasó y por qué es peligroso:** cuando no existe un `.npmignore`, npm usa el `.gitignore` para decidir qué no publicar. Sin él, el paquete incluye el archivo `.env` con las API keys y todos los archivos generados (`data/`, `descripciones/` y, si existen, `imagenes/`). Un `npm publish` real dejaría las claves públicas en el registro de npm para cualquiera que descargue el paquete, y habría que revocarlas de inmediato. Después del experimento se restauró el nombre `.gitignore`.

## Preguntas de reflexión

**1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?**
El id debe identificar el contenido del mundo (situación, mundo y colores), no el momento en que se creó. `creadoEn` cambia en cada ejecución, así que si entrara en el hash el id sería distinto cada vez. El programa nunca encontraría el `.txt` ni el `.jpg` anteriores y volvería a gastar cuota en cada ejecución.

**2. ¿Por qué se le pide al modelo de texto la descripción en inglés?**
Los modelos de imágenes como FLUX se entrenaron sobre todo con descripciones en inglés, así que interpretan mejor sus palabras: estilos, iluminación y composición. Con una descripción en español suelen ignorar detalles o confundir colores y elementos de la escena.

**3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?**
Un JSON es texto legible que se convierte en objeto con `JSON.parse`. Una imagen son bytes binarios que no son texto. Base64 es una forma de escribir bytes usando solo 64 caracteres de texto seguros (A-Z, a-z, 0-9, `+`, `/`), y así una imagen puede viajar dentro de un JSON. Para recuperar los bytes se usa `Buffer.from(texto, 'base64')`.

**4. ¿Qué pasaría si guardas la imagen con `'utf-8'`? ¿Por qué?**
El archivo quedaría dañado y no se podría abrir. UTF-8 es una codificación de texto: al escribir con ella, los bytes que no forman caracteres válidos se reemplazan o se transforman, y la secuencia binaria del JPEG cambia. Los bytes de una imagen se deben escribir tal cual, pasando el `Buffer` a `writeFileSync` sin codificación.

**5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?**
Consumen cuota el paso 2 (modelo de texto) y el paso 3 (modelo de imágenes). El paso 1 es local. Antes de cada llamada, `fs.existsSync` revisa si ya existe `descripciones/mundo_<id>.txt` o `imagenes/mundo_<id>.jpg`. Si existe, se reutiliza el archivo y no se llama a la API. Como el id es siempre el mismo para los mismos datos, una segunda ejecución no gasta nada, y si un paso falla el siguiente intento continúa desde ahí.

**6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?**
_Pendiente: respóndela con tu propia experiencia (ver PROMPT.md)._
