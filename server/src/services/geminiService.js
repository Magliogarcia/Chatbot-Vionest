import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';

let genAIClient = null;

function getGenAI() {
  if (!config.gemini.apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(config.gemini.apiKey);
  }
  return genAIClient;
}

// Modelos en orden de preferencia si alguno sufre un pico de tráfico (503 / high demand)
const FALLBACK_MODELS = [
  config.gemini.model || 'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

async function generateWithFallback({ systemInstruction, prompt, isJson = false }) {
  const genAI = getGenAI();
  if (!genAI) return null;

  for (const modelName of FALLBACK_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const genModel = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: isJson ? 0.1 : 0.4,
            ...(isJson ? { responseMimeType: 'application/json' } : {})
          }
        });

        const fullPrompt = `${systemInstruction}\n\n${prompt}`;
        const result = await genModel.generateContent(fullPrompt);
        const text = result.response.text();
        return { text, modelUsed: modelName };
      } catch (err) {
        console.warn(`[Gemini] Intento ${attempt} con modelo "${modelName}" falló:`, err.message);
        // Si fue 503 (high demand) o 429, esperar 400ms y reintentar o pasar al siguiente modelo
        if (attempt === 1 && (err.message.includes('503') || err.message.includes('high demand'))) {
          await new Promise(r => setTimeout(r, 500));
        } else {
          break; // Pasar al siguiente modelo de la lista
        }
      }
    }
  }

  return null;
}

/**
 * Interpreta la intención del usuario y extrae parámetros de búsqueda mediante Gemini
 */
export async function parseQueryWithGemini(userMessage, currentContext) {
  const systemInstruction = `
Eres el módulo de extracción de intenciones con Inteligencia Artificial para el sistema de base de datos de clientes de Vionest.
Tu trabajo es interpretar la pregunta del empleado en español y devolver EXCLUSIVAMENTE un objeto JSON válido con los parámetros de búsqueda.

Campos posibles en la base de datos de clientes:
- 'Nombre de la Empresa'
- 'Número telefónico'
- 'Estatus actual'
- 'Escuadrón Asignado'
- 'Contacto Principal'
- 'Ubicación exacta'
- 'Investigador Asignado'
- 'Halcón Asignado'
- 'URL Investigación Rastreador'
- 'URL Análisis del Cliente'
- 'URL Demo'
- 'URL Repositorio'
- 'URL Contrato'
- 'URL Cronograma'
- 'URL Desarrollo'
- 'Fecha Primer Contacto'
- 'Fecha Re-Contacto'
- 'Fecha de Cita'
- 'Feedback Llamada'
- 'Feedback de la cita'
- 'Tipo de Desarrollo'
- 'Plan activo'
- 'Observaciones'
- 'Estatus de Teléfono'

Colección auxiliar:
- 'clientes_telefonos_verificacion' (para verificar si un número está registrado o verificado)

Tipos de intención (intent):
1. 'CLIENT_SEARCH': Busca una empresa por nombre o pregunta qué información hay sobre ella.
2. 'CLIENT_FIELD_QUERY': Pregunta por un campo específico de una empresa (por ejemplo: teléfono, demo, observaciones, investigador, fecha).
3. 'VERIFY_PHONE': Quiere verificar si un número telefónico existe o está verificado en la colección auxiliar/maestro.
4. 'SEARCH_BY_PHONE': Busca qué cliente o empresa tiene un número telefónico dado.
5. 'FILTER_QUERY': Busca empresas por un filtro general (ej: por Escuadrón, por Estatus actual, o por Investigador).
6. 'HELP_OR_GREETING': Saludo o pregunta sobre qué puede hacer el sistema.
7. 'UNKNOWN': No se relaciona con clientes ni consultas de la empresa.

Contexto actual:
${currentContext ? `Cliente seleccionado actualmente: ID "${currentContext.clientId}", Nombre "${currentContext.clientName}"` : 'Ningún cliente seleccionado actualmente.'}

Reglas:
- Si el usuario dice "esa empresa", "este cliente", "su demo", "su teléfono", o pronombres relativos, y hay un cliente en contexto, marca "useCurrentContext": true.
- Si menciona un nombre de empresa nuevo o explícito, extrae "companyName".
- Si menciona un número telefónico, extrae "phoneNumber".
- Si es un filtro general (ej: "¿Qué empresas están en el Escuadrón 2?"), marca intent 'FILTER_QUERY', filterField ('Escuadrón Asignado', 'Estatus actual', etc.) y filterValue.
- Devuelve SOLO el JSON sin bloques markdown de código adicionales.
`;

  try {
    const res = await generateWithFallback({
      systemInstruction,
      prompt: `Mensaje del usuario: "${userMessage}"`,
      isJson: true
    });

    if (!res) return null;
    return JSON.parse(res.text);
  } catch (err) {
    console.warn('[Gemini] No se pudo parsear JSON de Gemini:', err.message);
    return null;
  }
}

/**
 * Redacta una respuesta conversacional fluida, inteligente y personalizada en español
 * utilizando EXCLUSIVAMENTE los datos fácticos recuperados de MongoDB.
 */
export async function draftResponseWithGemini({ userMessage, retrievedData, queryType, currentClientName }) {
  const systemInstruction = `
Eres el asistente virtual con Inteligencia Artificial interno de Vionest para el personal autorizado.
Tu rol es conversar y responder a las preguntas de los empleados sobre la base de datos de clientes de manera completamente natural, fluida, profesional, analítica y 100% verídica basada en los registros de MongoDB provistos.

REGLAS CRÍTICAS:
1. NUNCA respondas con plantillas estáticas o respuestas mecánicas predeterminadas. Redacta de forma orgánica, humana y personalizada según lo que el usuario preguntó.
2. Utiliza EXCLUSIVAMENTE los datos provistos en "DATOS RECUPERADOS DE MONGODB". No inventes clientes, teléfonos, fechas ni URLs.
3. Si un campo no está registrado o está vacío en los datos de la base de datos, coméntalo con naturalidad (por ejemplo: "Actualmente no contamos con un correo registrado para esta empresa").
4. Si hay URLs (demo, repositorio, investigación rastreador), preséntalas con hipervínculos markdown [Texto descriptivo](URL).
5. Respeta las fechas y estatus tal cual figuran en los registros.
6. Idioma: Español profesional, claro, colaborativo y proactivo.
`;

  const prompt = `
Mensaje del empleado: "${userMessage}"
Tipo de consulta: ${queryType}
Cliente en contexto: ${currentClientName || 'Ninguno'}

DATOS RECUPERADOS DE MONGODB:
${JSON.stringify(retrievedData, null, 2)}

Por favor, redacta tu respuesta conversacional completa para el empleado:`;

  const res = await generateWithFallback({
    systemInstruction,
    prompt,
    isJson: false
  });

  return res ? res.text.trim() : null;
}
