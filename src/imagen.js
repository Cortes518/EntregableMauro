// imagen.js: consulta al modelo de imágenes (fetch) y devuelve los bytes
// Servicio: Pollinations (sin clave). La imagen llega directamente como bytes, sin JSON.

// Paso 1: enviar la descripción al modelo de imágenes y devolver los bytes de la imagen
async function generarImagen(descripcion) {
  // 1.1 petición GET: la descripción va dentro de la URL, por eso pasa por encodeURIComponent
  const url = `${process.env.IMAGEN_URL}/${encodeURIComponent(descripcion)}?width=1024&height=1024&nologo=true`;
  const respuesta = await fetch(url, { signal: AbortSignal.timeout(60000) });

  // 1.2 si el servicio responde con error, se lanza con su estado para explicarlo en index.js
  // (Pollinations responde 402 FREE_LIMIT si se pide más de 1 imagen cada 45 segundos)
  if (!respuesta.ok) {
    const error = new Error(`El modelo de imágenes respondió con el estado ${respuesta.status}.`);
    error.status = respuesta.status;
    error.retryAfter = respuesta.headers.get('retry-after');
    throw error;
  }

  // 1.3 comprobar que lo recibido es una imagen y no una página de error
  const tipo = respuesta.headers.get('content-type') || '';
  if (!tipo.startsWith('image/')) {
    throw new Error(`El modelo de imágenes no devolvió una imagen (tipo recibido: ${tipo || 'desconocido'}).`);
  }

  // 1.4 los bytes llegan directamente: se convierten en Buffer y se valida que no estén vacíos
  const bytes = Buffer.from(await respuesta.arrayBuffer());
  if (bytes.length === 0) {
    throw new Error('El modelo de imágenes devolvió una imagen vacía.');
  }

  return bytes;
}

module.exports = { generarImagen };
