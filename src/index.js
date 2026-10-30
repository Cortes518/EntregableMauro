// index.js: orquesta los pasos 1 a 3
const fs = require('fs');
const path = require('path');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');

const RAIZ = path.join(__dirname, '..');
const CARPETA_DESCRIPCIONES = path.join(RAIZ, 'descripciones');

// Muestra la ruta relativa al proyecto, con "/" como en el enunciado
function rutaCorta(ruta) {
  return path.relative(RAIZ, ruta).replaceAll('\\', '/');
}

async function main() {
  try {
    // Paso 0: cargar las claves del archivo .env
    process.loadEnvFile(path.join(RAIZ, '.env'));

    // Paso 1: de los parámetros al objeto JSON
    const args = process.argv.slice(2);
    const rutaJson = guardarMundo(crearMundo(args));
    console.log(`Paso 1: mundo guardado en ${rutaCorta(rutaJson)}`);

    // Paso 2: se consulta el JSON guardado (no el objeto en memoria) y se pide la descripción
    const mundo = leerMundo(rutaJson);
    const rutaTxt = path.join(CARPETA_DESCRIPCIONES, `mundo_${mundo.id}.txt`);
    const descripcion = await describirMundo(mundo);
    fs.mkdirSync(CARPETA_DESCRIPCIONES, { recursive: true });
    fs.writeFileSync(rutaTxt, descripcion, 'utf-8');
    console.log(`Paso 2: descripción guardada en ${rutaCorta(rutaTxt)}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
