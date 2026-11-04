import { config } from '../config/index.js';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Realiza una llamada a un modelo específico con timeout estricto mediante AbortController.
 */
async function callSingleModel({ model, systemInstruction, prompt, isJson, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Timeout de ${timeoutMs / 1000}s excedido para ${model}`));
  }, timeoutMs);

  const startTime = Date.now();

  try {
    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ];

    const bodyPayload = {
      model,
      messages,
      temperature: isJson ? 0.1 : 0.4
    };

    if (isJson) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    const res = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.openRouter.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.clientOrigin || 'http://localhost:5173',
        'X-Title': 'Vionest Chatbot'
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errorText.slice(0, 250)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Respuesta vacía de la API de OpenRouter');
    }

    const durationMs = Date.now() - startTime;
    return { text: content.trim(), modelUsed: model, durationMs };
  } catch (err) {
    clearTimeout(timer);
    const durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || err.message?.includes('Timeout');
    throw {
      isTimeout,
      model,
      durationMs,
      message: isTimeout ? `Timeout excedido (${timeoutMs / 1000}s)` : err.message
    };
  }
}

/**
 * Ejecuta la llamada en cascada secuencial (Fallback):
 * 1. Intenta con Agente 1 (Timeout 10s).
 * 2. Si falla o tarda más de 10s, pasa a Agente 2.
 * 3. Si falla o tarda más de 10s, pasa a Agente 3.
 * Si pasan 40s en total sin respuesta de ningún agente, aborta con aviso de diagnóstico.
 */
export async function generateWithFallback({ systemInstruction, prompt, isJson = false }) {
  if (!config.openRouter.apiKey) {
    console.warn('[OpenRouter] No se ha configurado OPENROUTER_API_KEY. Operando en modo determinista.');
    return null;
  }

  const models = config.openRouter.models;
  const timeoutPerAgent = config.openRouter.timeoutMs || 10000;
  const maxTotalTimeout = config.openRouter.maxTotalTimeoutMs || 40000;
  const cascadeStartTime = Date.now();

  const failedAttempts = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const totalElapsed = Date.now() - cascadeStartTime;

    // Verificar si el tiempo total acumulado ya alcanzó o superó los 40 segundos
    if (totalElapsed >= maxTotalTimeout) {
      console.error(`[OpenRouter] ⚠️ Tiempo total límite excedido (${Math.round(totalElapsed / 1000)}s >= ${maxTotalTimeout / 1000}s). Deteniendo agentes.`);
      break;
    }

    // Calcular el tiempo restante disponible para este agente sin exceder el tope total de 40s
    const remainingTime = maxTotalTimeout - totalElapsed;
    const currentTimeout = Math.min(timeoutPerAgent, remainingTime);

    console.log(`[OpenRouter] 🤖 [Agente ${i + 1}/${models.length}] Probando modelo: "${model}" (Timeout: ${currentTimeout / 1000}s)...`);

    try {
      const result = await callSingleModel({
        model,
        systemInstruction,
        prompt,
        isJson,
        timeoutMs: currentTimeout
      });

      console.log(`[OpenRouter] ✅ [Agente ${i + 1}] "${model}" respondió con éxito en ${result.durationMs}ms.`);
      return result;
    } catch (err) {
      failedAttempts.push({ agentNumber: i + 1, model, reason: err.message, durationMs: err.durationMs });
      console.warn(`[OpenRouter] ⚠️ [Agente ${i + 1}] "${model}" no completó la solicitud (${err.durationMs}ms): ${err.message}.`);

      if (i < models.length - 1) {
        console.log(`[OpenRouter] 🔄 Activando siguiente agente de respaldo en cascada...`);
      }
    }
  }

  const totalTime = Date.now() - cascadeStartTime;
  console.error(`[OpenRouter] ❌ Ningún agente de IA completó la respuesta tras ${Math.round(totalTime / 1000)}s. Resumen de intentos:`, failedAttempts);

  return null;
}

/**
 * Interpreta la intención del usuario y extrae parámetros de búsqueda
 */
export async function parseQueryWithAI(userMessage, currentContext) {
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
- Devuelve SOLO el JSON sin texto o comentarios adicionales.
`;

  try {
    const res = await generateWithFallback({
      systemInstruction,
      prompt: `Mensaje del usuario: "${userMessage}"`,
      isJson: true
    });

    if (!res || !res.text) return null;

    // Limpiar posibles bloques markdown si el modelo los incluyó
    let cleaned = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[OpenRouter] No se pudo parsear JSON de intención:', err.message);
    return null;
  }
}

/**
 * Redacta una respuesta conversacional fluida, inteligente y personalizada en español
 * utilizando EXCLUSIVAMENTE los datos fácticos recuperados de MongoDB.
 */
export async function draftResponseWithAI({ userMessage, retrievedData, queryType, currentClientName }) {
  const systemInstruction = `
Eres el asistente virtual con Inteligencia Artificial interno de Vionest para el personal autorizado.
Tu rol es conversar y responder a las preguntas de los empleados sobre la base de datos de clientes de manera completamente natural, fluida, profesional, analítica y 100% verídica basada en los registros de MongoDB provistos.

REGLAS CRÍTICAS:
1. NUNCA respondas con plantillas estáticas o respuestas mecánicas predeterminadas. Redacta de forma orgánica, humana y personalizada según lo que el usuario preguntó.
2. Utiliza EXCLUSIVAMENTE los datos provistos en "DATOS RECUPERADOS DE MONGODB". No inventes clientes, teléfonos, fechas ni URLs.
3. Si un campo no está registrado o está vacío en los datos de la base de datos, coméntalo con naturalidad (por ejemplo: "Actualmente no contamos con un correo registrado para esta empresa").
4. Si hay URLs (demo, repositorio, investigación rastreador), preséntalas con hipervínculos markdown limpios [Texto descriptivo](URL).
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

// Aliases para retrocompatibilidad
export const parseQueryWithGemini = parseQueryWithAI;
export const draftResponseWithGemini = draftResponseWithAI;

