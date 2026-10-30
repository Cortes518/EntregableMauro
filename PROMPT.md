# PROMPT.md: cómo construí mundos-ia

## A. Declaración

**Usé IA: sí.**

## B. Herramienta y modelo

- Herramienta: **Claude Code** (aplicación de escritorio, pestaña Code), con acceso a la carpeta del proyecto para crear archivos y ejecutar comandos.
- Modelos: **Claude Sonnet 5.5** (`claude-sonnet-5-5`) para el plan y **Claude Opus 5.5** (`claude-opus-5-5`) para la implementación. Cambié de modelo con el comando `/model`.

## C. Prompt inicial (literal)

> Vamos a construir un programa de consola que cumpla con los requerimientos que te enviare a continuacion, vamos a hacer un plan de implementacion para ir paso a pasa e ir verificando que todo lo hecho este funcionando correctamente y cumpla con los requerimientos que te de

En el siguiente mensaje pegué el enunciado completo del taller (secciones 1 a 9) y terminé con:

> Esto es todo lo que necesitas saber para hacer el plan de implementacion

_(Pega aquí el enunciado tal como lo enviaste si tu instructor lo exige completo.)_

## D. Prompts siguientes, qué respondió la IA y qué hice

| # | Prompt | Qué respondió la IA | Qué hice con la respuesta |
|---|---|---|---|
| 1 | El enunciado completo + "Esto es todo lo que necesitas saber para hacer el plan de implementacion" | Un plan de 9 pasos (0 a 8), uno por parte del taller, cada uno con su forma de verificarlo y un commit. Propuso CommonJS y Groq (texto) + NVIDIA FLUX.1-schnell (imagen). Advirtió que no pegara mis claves en el chat. | Lo revisé contra la rúbrica y lo acepté como guía. |
| 2 | `/ponytail lite` | Cambió a un modo de trabajo de "código mínimo", sin funciones extra que no pidiera el enunciado. | Lo activé para que no agregara librerías ni opciones fuera de la sección 4. |
| 3 | "Muy bien, te dare la libertad de hacer los paso a paso de corrido pero te pondre 3 condiciones: 1- Al terminar un paso verifica que cumpla estrictamente con los requerimientos dados 2- Al terminar cada paso verifica que el codigo funcione realmente 3- Al terminar haz un archivo extra llamado "TRABAJO_REALIZADO.md" donde especifiques lo que hicistes y como funciona" | Construyó las partes 1 a 6 con un commit por parte. Después de cada parte ejecutó el programa: casos inválidos, una llamada real de texto, un servidor de prueba local con el formato de NVIDIA para comprobar la imagen y errores reales con clave falsa. | Revisé cada resultado y el archivo TRABAJO_REALIZADO.md. _(Completa con lo que hiciste tú: pegar tus claves, la prueba real con NVIDIA, etc.)_ |

## E. Cambios que hice yo sobre lo que entregó la IA

_Pendiente: describe al menos 3 cambios que hagas tú y por qué._ Ideas de dónde mirar:

1. El mensaje de sistema en `src/texto.js` (por ejemplo, el estilo artístico o la cantidad de palabras).
2. Los textos de los mensajes de error en `explicarError` de `src/index.js`.
3. Los servicios del `.env` si elegiste otros, o el tamaño de la imagen en `src/imagen.js`.

## F. Una línea que no entendía al principio

_Pendiente: elige una línea y explícala con tus palabras._ Candidatas:

- `const bytes = Buffer.from(artefacto.base64 || '', 'base64');` en `src/imagen.js`
- `const id = hash({ situacion, mundo, colores }).slice(0, 8);` en `src/mundo.js`
- `signal: AbortSignal.timeout(30000)` en `src/texto.js`

## G. Un error y cómo se resolvió

**Error de la IA:** en la primera prueba real, la descripción generada por el modelo de texto tenía 103 palabras, estaba en inglés y nombraba los 5 colores, pero **no indicaba ningún estilo artístico**, que el enunciado exige (escena, elementos, iluminación, composición *y estilo*). No hubo mensaje de error: el programa funcionaba, pero no cumplía el requisito.

**Solución:** se reforzó la regla en el mensaje de sistema de `src/texto.js` agregando `(name the style explicitly, for example "digital concept art")`. En la segunda prueba la descripción empezó con *"A dramatic digital concept art scene..."*.

**Otro problema encontrado:** al probar en Windows PowerShell 5.1, un argumento vacío `""` no llega al programa (PowerShell lo elimina). Las pruebas de argumentos vacíos se hicieron con Git Bash, donde sí llegan.

---

Este archivo no contiene ninguna API key.
