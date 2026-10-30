// index.js: orquesta los pasos 1 a 3
const path = require('path');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');

const RAIZ = path.join(__dirname, '..');

// Muestra la ruta relativa al proyecto, con "/" como en el enunciado
function rutaCorta(ruta) {
  return path.relative(RAIZ, ruta).replaceAll('\\', '/');
}

function main() {
  try {
    // Paso 1: de los parámetros al objeto JSON
    const args = process.argv.slice(2);
    const rutaJson = guardarMundo(crearMundo(args));
    console.log(`Paso 1: mundo guardado en ${rutaCorta(rutaJson)}`);

    // Se consulta lo guardado, no el objeto en memoria
    const mundo = leerMundo(rutaJson);
    console.log(mundo);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
