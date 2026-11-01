# PROMPT.md: cómo construí mundos-ia

## A. Declaración

**Usé IA: sí.**

## B. Herramienta y modelo

- Herramienta: **Claude Code** (aplicación de escritorio, pestaña Code), con acceso a la carpeta del proyecto para crear archivos y ejecutar comandos.
- Modelos: **Claude Sonnet 5.5** (`claude-sonnet-5-5`) para el plan, **Claude Opus 5.5** (`claude-opus-5-5`) para construir las partes 1 a 7, y de nuevo **Claude Sonnet 5.5** para las pruebas reales con mis API keys, el análisis del problema con NVIDIA, el cambio a Pollinations, la revisión de las evidencias y la revisión final. Cambié de modelo con el comando `/model`.

## C. Prompt inicial (literal)

> Vamos a construir un programa de consola que cumpla con los requerimientos que te enviare a continuacion, vamos a hacer un plan de implementacion para ir paso a pasa e ir verificando que todo lo hecho este funcionando correctamente y cumpla con los requerimientos que te de

En el siguiente mensaje pegué el enunciado completo del taller (secciones 1 a 9) y terminé con:

> Esto es todo lo que necesitas saber para hacer el plan de implementacion

## D. Prompts siguientes, qué respondió la IA y qué hice

| # | Prompt | Qué respondió la IA | Qué hice con la respuesta |
|---|---|---|---|
| 1 | El enunciado completo + "Esto es todo lo que necesitas saber para hacer el plan de implementacion" | Un plan de 9 pasos (0 a 8), uno por parte del taller, cada uno con su forma de verificarlo y un commit. Propuso CommonJS y Groq (texto) + NVIDIA FLUX.1-schnell (imagen). Advirtió que no pegara mis claves en el chat. | Lo revisé contra la rúbrica y lo acepté como guía. |
| 2 | `/ponytail lite` | Cambió a un modo de trabajo de "código mínimo", sin funciones extra que no pidiera el enunciado. | Lo activé para que no agregara librerías ni opciones fuera de la sección 4. |
| 3 | "Muy bien, te dare la libertad de hacer los paso a paso de corrido pero te pondre 3 condiciones: 1- Al terminar un paso verifica que cumpla estrictamente con los requerimientos dados 2- Al terminar cada paso verifica que el codigo funcione realmente 3- Al terminar haz un archivo extra llamado "TRABAJO_REALIZADO.md" donde especifiques lo que hicistes y como funciona" | Construyó las partes 1 a 6 con un commit por parte. Después de cada parte ejecutó el programa: casos inválidos, una llamada real de texto, un servidor de prueba local con el formato de NVIDIA para comprobar la imagen y errores reales con clave falsa. | Revisé cada resultado y el archivo TRABAJO_REALIZADO.md.

## E. Cambios que hice yo sobre lo que entrego la IA

1. genere y agregue mis propias API keys, la IA dejo el .env con `pega_aqui_tu_clave` asi que genere mi clave de Groq y de NVIDIA en sus consolas y las puse en el .env, que esta en el .gitignore y no se sube al git, la clave de NVIDIA al final no se uso porque se quedaba colgada

2. cambie los mensajes de error en src/index.js, los reescribi con mis propias palabras, por ejemplo "La API key no es valida, revisa tu archivo .env" y "El servicio tardo demasiado en responder, prueba de nuevo.", tambien ajuste los mensajes de los pasos 2 y 3, y los de src/texto.js, lo hice para que los mensajes se vean como los escribiria yo y los pueda explicar en la sustentacion

3. cambie el servicio de imagenes de NVIDIA a Pollinations, con mi clave de NVIDIA el programa llegaba al paso 3 y mostraba "El servicio tardo demasiado en responder", Claude y yo buscamos el porque, la clave era valida (el API de gestion de NVIDIA respondia 200 y el modelo `flux_1-schnell` figuraba como `ACTIVE`), pero su endpoint de inferencia aceptaba la conexion y no devolvia ninguna respuesta ni en 60 s dentro del programa ni en 120 s con `curl`, el endpoint de texto de NVIDIA se comportaba igual asi que el problema era del servicio y no de mi codigo ni de mi cuenta, como la guia del taller ofrece Pollinations como tercera opcion de imagenes (sin clave, una imagen cada 45 s por IP) se reescribio src/imagen.js para usarlo, una peticion GET que devuelve los bytes de la imagen directamente, con eso se generaron las imagenes de dos mundos distintos

## F. Una linea que no entendia al principio

- `const bytes = Buffer.from(await respuesta.arrayBuffer());` en src/imagen.js: esta linea es asincronica y respuesta.arrayBuffer() recoge los bytes y Buffer.from() los envuelve para guardarlos
- `const id = hash({ situacion, mundo, colores }).slice(0, 8);` en src/mundo.js : el hash produce una "huella digital" que verifica la integridad de los archivos en una cadena de 40 caracteres y siempre cada vez que hay un dato diferente genera otra huella diferente y el .slice sirve para que el id quede con solo 8 caracteres de los 40 que se generan en el hash para que el nombre del archivo quede mas corto, Lo importante es que el creadoEn no entra en el hash porque cambia en cada ejecucion y entonces el id seria distinto cada vez y el programa nunca encontraria el .txt ni el .jpg anteriores asi con los mismos datos siempre sale el mismo id y se reutilizan los archivos

- `signal: AbortSignal.timeout(30000)` en src/texto.js:  es una señal que se activa luego de 30 segundos si no hay una respuesta o se demora mucho, sirve para que no quede esperando para siempre y si se activa manda el mensaje del error explicandolo segun lo que paso, por ejemplo este es de TimeOutError

## G. Un error y cómo se resolvió

Error de la IA: en la primera prueba real, la descripcion generada por el modelo de texto tenia 103 palabras, estaba en ingles y nombraba los 5 colores, pero no indicaba ningun estilo artistico, que el enunciado exige escena, elementos, iluminacion, composicion y estilo, no hubo mensaje de error, el programa funcionaba pero no cumplia el requisito

**Solución:** se reforzó la regla en el mensaje de sistema de `src/texto.js` agregando `(name the style explicitly, for example "digital concept art")`. En la segunda prueba la descripción empezó con *"A dramatic digital concept art scene..."*.

Error con NVIDIA: al hacer la primera prueba real con mis API keys, el programa guardo el JSON y la descripcion pero en el paso 3 mostro el mensaje `Error en el paso 3: El servicio tardo demasiado en responder, prueba de nuevo.` (es el TimeoutError). Con Claude revisamos que mi clave de NVIDIA era valida (el API de gestion respondia 200 y el modelo `flux_1-schnell` estaba `ACTIVE`), pero el endpoint de generacion de imagenes aceptaba la conexion y nunca respondia, ni en 60 s dentro del programa ni en 120 s con `curl`, y el de texto de NVIDIA hacia lo mismo, asi que el problema era del servicio y no de mi codigo. Lo resolvi cambiando el servicio de imagenes a Pollinations (ver la seccion E, cambio 3), y el programa retomo desde el paso 3 sin repetir la llamada a Groq porque la descripcion ya estaba guardada.

Otro problema encontrado durante el analisis con Claude: al probar en Windows PowerShell 5.1, un argumento vacio `""` no llega al programa (PowerShell lo elimina). Las pruebas de argumentos vacíos se hicieron con Git Bash, donde sí llegan.

---

Este archivo no contiene ninguna API key.
