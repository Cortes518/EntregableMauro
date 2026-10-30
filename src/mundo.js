// mundo.js: valida los argumentos, crea el objeto y lo guarda o lee (JSON)
const fs = require('fs');
const path = require('path');
const hash = require('object-hash');

// Rutas construidas desde la ubicación de este archivo, no desde donde se ejecuta
const CARPETA_DATA = path.join(__dirname, '..', 'data');

const EJEMPLO_USO = 'Ejemplo de uso:\n  npm start -- "Una tormenta eléctrica amenaza la ciudad flotante" "Aerópolis, un archipiélago de islas que flotan sobre las nubes" rojo azul verde dorado violeta';

// Paso 1: validar los argumentos y crear el objeto del mundo
function crearMundo(args) {
  // 1.1 deben llegar exactamente 7 argumentos
  if (args.length !== 7) {
    throw new Error(`Se esperaban 7 argumentos (situación, mundo y 5 colores) y llegaron ${args.length}.\nRecuerda poner entre comillas la situación y el mundo.\n${EJEMPLO_USO}`);
  }

  // 1.2 ningún argumento puede estar vacío ni tener solo espacios
  for (let i = 0; i < args.length; i++) {
    if (args[i].trim() === '') {
      throw new Error(`El argumento número ${i + 1} está vacío.\n${EJEMPLO_USO}`);
    }
  }

  const situacion = args[0].trim();
  const mundo = args[1].trim();
  const colores = args.slice(2).map((color) => color.trim());

  // 1.3 los 5 colores deben ser distintos (sin distinguir mayúsculas de minúsculas)
  const enMinusculas = colores.map((color) => color.toLowerCase());
  for (let i = 0; i < enMinusculas.length; i++) {
    if (enMinusculas.indexOf(enMinusculas[i]) !== i) {
      throw new Error(`El color "${colores[i]}" está repetido. Los 5 colores deben ser distintos.\n${EJEMPLO_USO}`);
    }
  }

  // 1.4 el id NO incluye creadoEn: así los mismos datos producen siempre el mismo id
  const id = hash({ situacion, mundo, colores }).slice(0, 8);

  return {
    id,
    situacion,
    mundo,
    colores,
    creadoEn: new Date().toISOString()
  };
}

// Paso 2: guardar el objeto en data/mundo_<id>.json y devolver la ruta
function guardarMundo(mundo) {
  fs.mkdirSync(CARPETA_DATA, { recursive: true });
  const ruta = path.join(CARPETA_DATA, `mundo_${mundo.id}.json`);
  fs.writeFileSync(ruta, JSON.stringify(mundo, null, 2), 'utf-8');
  return ruta;
}

// Paso 3: leer el JSON guardado y convertirlo de nuevo en objeto
function leerMundo(ruta) {
  return JSON.parse(fs.readFileSync(ruta, 'utf-8'));
}

module.exports = { crearMundo, guardarMundo, leerMundo };
