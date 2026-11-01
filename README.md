# mundos-ia

Programa de consola en Node.js que crea bocetos visuales de mundos imaginarios para un estudio de videojuegos:

1. Recibe por parámetros una **situación**, un **mundo** y **5 colores**, y los guarda en `data/mundo_<id>.json`.
2. Lee ese JSON y se lo envía a un **modelo de lenguaje** para que escriba la descripción de una imagen. La guarda en `descripciones/mundo_<id>.txt`.
3. Envía esa descripción a un **modelo de imágenes** y guarda la imagen en `imagenes/mundo_<id>.jpg`.

Si se repite el mismo comando, no se vuelve a llamar a ninguna API: se reutilizan los archivos ya generados.

## Requisitos

- Node.js 20.12 o superior (`node -v`), npm y Git.
- Una clave del servicio de texto (Groq). El servicio de imágenes (Pollinations) no necesita clave (ver [Servicios](#servicios-elegidos)).

## Instalación y configuración

```bash
git clone https://github.com/Cortes518/EntregableMauro.git
cd EntregableMauro
npm install
```

Copia `.env.example` a `.env` y reemplaza `pega_aqui_tu_clave` por tu clave real de Groq:

```bash
cp .env.example .env
```

```
TEXTO_API_KEY=pega_aqui_tu_clave
TEXTO_URL=https://api.groq.com/openai/v1/chat/completions
TEXTO_MODELO=openai/gpt-oss-20b
IMAGEN_URL=https://image.pollinations.ai/prompt
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
Paso 2: descripcion guardada en descripciones/mundo_cba86145.txt
Paso 3: imagen guardada en imagenes/mundo_cba86145.jpg
Listo. Revisa la carpeta imagenes/
```

Segunda ejecución del mismo comando:

```
Paso 1: mundo guardado en data/mundo_cba86145.json
Paso 2: la descripcion ya existia, no se llamo al modelo de texto.
Paso 3: la imagen ya existia, no se llamo al modelo de imagenes.
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
| Estado 401 o 403 | La API key no es valida, revisa tu archivo .env |
| Estado 402 o 429 | Superaste el limite gratuito, espera un momento y vuelve a intentar (si existe, se indica el `retry-after`) |
| Estado 404 o 410 | El modelo o la URL no existen, revisa tu configuracion |
| Estado 500 o más (servicio caído) | El servicio no esta disponible en este momento, espera un poco y intenta de nuevo |
| `fetch` lanza `TypeError` | No se pudo conectar, revisa tu internet o la URL |
| `TimeoutError` | El servicio tardo demasiado en responder, prueba de nuevo. |
| No existe `.env` | No se encontro el archivo .env , copia .env.example a .env y pon tus claves |

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
| Imagen | **Pollinations** (sin clave; la imagen llega directamente como bytes, límite de 1 imagen cada 45 s por IP) | [enter.pollinations.ai](https://enter.pollinations.ai) |

**Por qué Pollinations en la imagen:** se intentó primero NVIDIA FLUX.1-schnell, pero su endpoint de inferencia no respondió (la conexión se abría y no llegaba ninguna respuesta, ni siquiera en el de texto de NVIDIA, aunque la clave era válida). Por eso se cambió a Pollinations, una de las opciones de la guía del taller.

El servicio de texto se puede cambiar solo editando el `.env`: NVIDIA (`https://integrate.api.nvidia.com/v1/chat/completions`) y Pollinations (`https://text.pollinations.ai/openai`, modelo `openai`) usan el mismo formato.

## Experimento: `npm publish --dry-run` con y sin `.gitignore`

`npm publish --dry-run` simula la publicación: muestra qué archivos viajarían en el paquete, sin publicar nada. Las salidas completas y las capturas están en [evidencias/](evidencias/) (`salidaDePublish.md` y `salidaDePublish2.md`).

| | Con `.gitignore` | Con `.gitignore.off` (sin `.gitignore`) |
|---|---|---|
| Archivos en el paquete | 18 | 32 |
| Tamaño del paquete | 217,9 kB | 471,1 kB |
| `.env` (las claves) | **no aparece** | **aparece (295 B)** |
| `data/`, `descripciones/`, `imagenes/` | no aparecen | aparecen |

Con `.gitignore`, npm solo empaqueta lo necesario: `.env.example`, los `.md`, `package.json`, `src/` y `evidencias/`. Sin él, además de los archivos generados en cada ejecución, el paquete incluye el `.env` con las API keys reales.

**Qué pasó:** cuando no existe un `.npmignore`, npm usa el `.gitignore` para decidir qué excluir. Así lo avisa en la primera salida: `gitignore-fallback ... using .gitignore for file exclusion`. Al renombrar el archivo a `.gitignore.off`, npm dejó de encontrarlo y empaquetó todo lo que había en la carpeta.

**Por qué es peligroso:**

- Un `npm publish` real dejaría el `.env` en el registro público de npm. Cualquiera que ejecute `npm install mundos-ia` recibiría las claves. Los bots que rastrean registros y repositorios buscan claves con formatos conocidos (`gsk_...`, `nvapi-...`) y las usan en minutos.
- Despublicar o borrar el archivo después no lo arregla: el paquete pudo haberse descargado ya, y las claves quedan expuestas. La única solución es **revocarlas** y crear otras.
- Con git pasa lo mismo: sin `.gitignore`, un `git add -A` y un `git push` subirían el `.env` a GitHub, y quedaría en el historial aunque se borrara después.
- Además se publicarían datos que no deben ir en el paquete: los mundos generados y las imágenes.

Después del experimento se restauró el nombre `.gitignore` y se comprobó con `git check-ignore .env` que el `.env` vuelve a estar ignorado.

## Preguntas de reflexión

**1. ¿Por qué el id se calcula sin la fecha? ¿Qué pasaría si la incluyeras?**
El id debe identificar el contenido del mundo (situación, mundo y colores), no el momento en que se creó. `creadoEn` cambia en cada ejecución, así que si entrara en el hash el id sería distinto cada vez. El programa nunca encontraría el `.txt` ni el `.jpg` anteriores y volvería a gastar cuota en cada ejecución.

**2. ¿Por qué se le pide al modelo de texto la descripción en inglés?**
Los modelos de imágenes se entrenaron sobre todo con descripciones en inglés, así que interpretan mejor sus palabras: estilos, iluminación y composición. Con una descripción en español suelen ignorar detalles o confundir colores y elementos de la escena.

**3. ¿Qué diferencia hay entre una respuesta JSON de texto y una respuesta con los bytes de una imagen? ¿Qué es base64?**
Un JSON es texto legible que se convierte en objeto con `JSON.parse`. Una imagen son bytes binarios que no son texto. Base64 es una forma de escribir bytes usando solo 64 caracteres de texto seguros (A-Z, a-z, 0-9, `+`, `/`), y así una imagen puede viajar dentro de un JSON. Para recuperar los bytes de un base64 se usa `Buffer.from(texto, 'base64')`. Con Pollinations la imagen llega directamente como bytes y se usa `Buffer.from(await respuesta.arrayBuffer())`.

**4. ¿Qué pasaría si guardas la imagen con `'utf-8'`? ¿Por qué?**
El archivo quedaría dañado y no se podría abrir. UTF-8 es una codificación de texto: al escribir con ella, los bytes que no forman caracteres válidos se reemplazan o se transforman, y la secuencia binaria del JPEG cambia. Los bytes de una imagen se deben escribir tal cual, pasando el `Buffer` a `writeFileSync` sin codificación.

**5. ¿Qué pasos consumen cuota gratuita y cómo evitaste repetirlos?**
Consumen cuota el paso 2 (modelo de texto) y el paso 3 (modelo de imágenes). El paso 1 es local. Antes de cada llamada, `fs.existsSync` revisa si ya existe `descripciones/mundo_<id>.txt` o `imagenes/mundo_<id>.jpg`. Si existe, se reutiliza el archivo y no se llama a la API. Como el id es siempre el mismo para los mismos datos, una segunda ejecución no gasta nada, y si un paso falla el siguiente intento continúa desde ahí.

**6. Si usaste IA: ¿qué fue lo más difícil de pedirle y qué parte tuviste que corregir tú?**
 Lo mas dificil para mi fue analizar linea por linea para identificar funciones que no habia visto en clases con Mauro y entender como funcionaba paso a paso, lo que tuve que corregir fue la implementacion de las API'S Keys ya que de por si Claude no las puede generar sola
