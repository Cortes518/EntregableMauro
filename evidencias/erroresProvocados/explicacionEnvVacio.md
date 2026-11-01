este sucede cuando si hay un archivo env pero esta vacio, sin TEXTO_URL, fetch recibe una URL undefined y lanza un TypeError, que el programa muestra como “No se pudo conectar”

PS C:\Users\juanj\Downloads\Entregable\mundos-ia> npm start -- "una ciudad japones irlandes natural" "naturalista" violeta  rojo rosado  rosa azul

> mundos-ia@1.0.0 start
> node src/index.js una ciudad japones irlandes natural naturalista violeta rojo rosado rosa azul

Paso 1: mundo guardado en data/mundo_1425ad4e.json
Error en el paso 2: No se pudo conectar, revisa tu internet o la URL
PS C:\Users\juanj\Downloads\Entregable\mundos-ia> 