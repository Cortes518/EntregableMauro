// imagen.js: consulta al modelo de imágenes (fetch) y devuelve los bytes
// Servicio: NVIDIA FLUX.1-schnell (la imagen llega en base64 dentro de un JSON)

// Paso 1: enviar la descripción al modelo de imágenes y devolver los bytes de la imagen
async function generarImagen(descripcion) {
  // 1.1 petición POST; generar una imagen tarda más, por eso el tiempo de espera es de 60 s
  const respuesta = await fetch(process.env.IMAGEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${process.env.IMAGEN_API_KEY}`
    },
    body: JSON.stringify({
      prompt: descripcion,
      width: 1024,
      height: 1024,
      steps: 4,
      seed: 0
    }),
    signal: AbortSignal.timeout(60000)
  });

  // 1.2 si el servicio responde con error, se lanza con su estado para explicarlo en index.js
  if (!respuesta.ok) {
    const error = new Error(`El modelo de imágenes respondió con el estado ${respuesta.status}.`);
    error.status = respuesta.status;
    error.retryAfter = respuesta.headers.get('retry-after');
    throw error;
  }

  // 1.3 la imagen viene en datos.artifacts[0].base64
  const datos = await respuesta.json();
  const artefacto = datos.artifacts && datos.artifacts[0];
  if (!artefacto) {
    throw new Error('El modelo de imágenes no devolvió ninguna imagen.');
  }

  // 1.4 comprobar que la generación terminó bien
  if (artefacto.finishReason !== 'SUCCESS') {
    throw new Error(`El modelo de imágenes no terminó correctamente (finishReason: ${artefacto.finishReason}). Prueba con otra descripción.`);
  }

  // 1.5 convertir el texto base64 en bytes (Buffer) y validar que no estén vacíos
  const bytes = Buffer.from(artefacto.base64 || '', 'base64');
  if (bytes.length === 0) {
    throw new Error('El modelo de imágenes devolvió una imagen vacía.');
  }

  return bytes;
}

module.exports = { generarImagen };
