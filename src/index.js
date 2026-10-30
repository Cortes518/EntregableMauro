// index.js: orquesta los pasos 1 a 3
const fs = require('fs');
const path = require('path');
const { crearMundo, guardarMundo, leerMundo } = require('./mundo');
const { describirMundo } = require('./texto');
const { generarImagen } = require('./imagen');

const RAIZ = path.join(__dirname, '..');
const CARPETA_DESCRIPCIONES = path.join(RAIZ, 'descripciones');
const CARPETA_IMAGENES = path.join(RAIZ, 'imagenes');

// Muestra la ruta relativa al proyecto, con "/" como en el enunciado
function rutaCorta(ruta) {
  return path.relative(RAIZ, ruta).replaceAll('\\', '/');
}

// Traduce un error técnico a un mensaje claro en español (nunca incluye las claves)
function explicarError(error) {
  if (error.code === 'ENOENT' && error.path && error.path.endsWith('.env')) {
    return 'No se encontró el archivo .env. Copia .env.example a .env y pon tus claves.';
  }
  if (error.status === 401 || error.status === 403) {
    return 'La API key no es válida. Revisa tu archivo .env.';
  }
  if (error.status === 402 || error.status === 429) {
    const espera = error.retryAfter ? ` El servicio pide esperar ${error.retryAfter} segundos.` : '';
    return `Superaste el límite gratuito. Espera un momento e intenta de nuevo.${espera}`;
  }
  if (error.status === 404 || error.status === 410) {
    return 'El modelo o la URL no existen. Revisa tu configuración.';
  }
  if (error.name === 'TimeoutError') {
    return 'El servicio tardó demasiado en responder. Intenta de nuevo.';
  }
  if (error.name === 'TypeError') {
    return 'No se pudo conectar. Revisa tu internet o la URL.';
  }
  return error.message;
}

async function main() {
  let paso = 0;
  try {
    // Paso 0: cargar las claves del archivo .env
    process.loadEnvFile(path.join(RAIZ, '.env'));

    // Paso 1: de los parámetros al objeto JSON
    paso = 1;
    const args = process.argv.slice(2);
    const rutaJson = guardarMundo(crearMundo(args));
    console.log(`Paso 1: mundo guardado en ${rutaCorta(rutaJson)}`);

    // Paso 2: se consulta el JSON guardado (no el objeto en memoria) y se pide la descripción
    paso = 2;
    const mundo = leerMundo(rutaJson);
    const rutaTxt = path.join(CARPETA_DESCRIPCIONES, `mundo_${mundo.id}.txt`);
    if (fs.existsSync(rutaTxt)) {
      // 2.1 ahorro de cuota: si la descripción ya existe no se llama a la API
      console.log('Paso 2: la descripción ya existía, no se llamó al modelo de texto.');
    } else {
      const descripcion = await describirMundo(mundo);
      fs.mkdirSync(CARPETA_DESCRIPCIONES, { recursive: true });
      fs.writeFileSync(rutaTxt, descripcion, 'utf-8');
      console.log(`Paso 2: descripción guardada en ${rutaCorta(rutaTxt)}`);
    }

    // Paso 3: la descripción que se envía se lee desde el .txt guardado
    paso = 3;
    const rutaJpg = path.join(CARPETA_IMAGENES, `mundo_${mundo.id}.jpg`);
    if (fs.existsSync(rutaJpg)) {
      // 3.1 ahorro de cuota: si la imagen ya existe no se llama a la API
      console.log('Paso 3: la imagen ya existía, no se llamó al modelo de imágenes.');
    } else {
      const bytes = await generarImagen(fs.readFileSync(rutaTxt, 'utf-8'));
      fs.mkdirSync(CARPETA_IMAGENES, { recursive: true });
      fs.writeFileSync(rutaJpg, bytes); // los bytes se guardan tal cual, SIN 'utf-8'
      console.log(`Paso 3: imagen guardada en ${rutaCorta(rutaJpg)}`);
    }

    console.log('Listo. Revisa la carpeta imagenes/');
  } catch (error) {
    // Los archivos de los pasos anteriores se conservan: al ejecutar de nuevo se continúa desde aquí
    const donde = paso > 0 ? ` en el paso ${paso}` : '';
    console.error(`Error${donde}: ${explicarError(error)}`);
    process.exitCode = 1;
  }
}

main();
