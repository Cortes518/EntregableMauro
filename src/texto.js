// texto.js: consulta al modelo de lenguaje (fetch)

// Mensaje de sistema: va en inglés porque la respuesta debe estar en inglés
// (los modelos de imágenes entienden mejor ese idioma)
const MENSAJE_SISTEMA = `You are an art director who writes prompts for an image generation model.
You will receive a JSON object with a situation ("situacion"), a world ("mundo") and five colors ("colores").
Write the visual description of ONE single image of that imaginary world living that situation.
Rules:
- Exactly one paragraph in English, between 80 and 120 words.
- Describe an image, not a story: the scene, its main elements, the lighting, the composition and the artistic style (name the style explicitly, for example "digital concept art").
- Mention all five colors explicitly (translate them to English).
- No titles, no markdown, no lists, no quotes and no written text, letters or signs inside the image.
Answer only with the paragraph.`;

const LIMITE_CARACTERES = 1500;

// Paso 1: pedir al modelo de texto la descripción de la imagen del mundo
async function describirMundo(mundo) {
  // 1.1 petición POST con formato compatible con OpenAI
  const respuesta = await fetch(process.env.TEXTO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TEXTO_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.TEXTO_MODELO,
      messages: [
        { role: 'system', content: MENSAJE_SISTEMA },
        { role: 'user', content: JSON.stringify(mundo) }
      ]
    }),
    signal: AbortSignal.timeout(30000)
  });

  // 1.2 si el servicio responde con error, se lanza con su estado para explicarlo en index.js
  if (!respuesta.ok) {
    const error = new Error(`El modelo de texto respondio con el estado ${respuesta.status}.`);
    error.status = respuesta.status;
    error.retryAfter = respuesta.headers.get('retry-after');
    throw error;
  }

  // 1.3 leer el texto de la respuesta: datos.choices[0].message.content
  const datos = await respuesta.json();
  let descripcion = '';
  if (datos.choices && datos.choices[0] && datos.choices[0].message && datos.choices[0].message.content) {
    descripcion = datos.choices[0].message.content.trim();
  }

  // 1.4 validar la respuesta: no puede llegar vacía
  if (descripcion === '') {
    throw new Error('El modelo de texto devolvió una descripción vacía. Intenta de nuevo.');
  }

  // 1.5 si es muy larga se recorta (Cloudflare acepta máximo 2048 caracteres)
  if (descripcion.length > LIMITE_CARACTERES) {
    console.log(`Aviso: la descripción tenía ${descripcion.length} caracteres y se recortó a ${LIMITE_CARACTERES}.`);
    descripcion = descripcion.slice(0, LIMITE_CARACTERES);
  }

  return descripcion;
}

module.exports = { describirMundo };
