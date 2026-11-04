import { config } from '../config/index.js';
import { GoogleGenAI } from '@google/genai';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Realiza una llamada a un modelo de OpenRouter con timeout estricto mediante AbortController.
 */
async function callOpenRouterModel({ model, systemInstruction, prompt, isJson, timeoutMs }) {
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
 * Realiza una llamada a Gemini Oficial (Google Gen AI) como Agente de Respaldo 3
 */
async function callGeminiOfficial({ systemInstruction, prompt, isJson, timeoutMs }) {
  if (!config.gemini.apiKey) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  const startTime = Date.now();
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  const modelName = config.gemini.model || 'gemini-3.8-flash';

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout de ${timeoutMs / 1000}s excedido para ${modelName}`)), timeoutMs);
  });

  const fullPrompt = `${systemInstruction}\n\n${prompt}`;
  
  const generatePromise = ai.models.generateContent({
    model: modelName,
    contents: fullPrompt,
    config: {
      temperature: isJson ? 0.1 : 0.4,
      ...(isJson ? { responseMimeType: 'application/json' } : {})
    }
  });

  const response = await Promise.race([generatePromise, timeoutPromise]);
  const text = response?.text;

  if (!text) {
    throw new Error('Respuesta vacía de Gemini oficial');
  }

  const durationMs = Date.now() - startTime;
  return { text: text.trim(), modelUsed: `google/${modelName} (oficial)`, durationMs };
}

/**
 * Ejecuta la llamada en cascada secuencial (Fallback):
 * 1. Agente 1: dots-studio/dots-3-note-preview:free (OpenRouter)
 * 2. Agente 2: google/gemma-4-26b-a4b-it:free (OpenRouter)
 * 3. Agente 3: gemini-3.8-flash oficial de Google (SDK oficial)
 */
export async function generateWithFallback({ systemInstruction, prompt, isJson = false }) {
  const models = config.openRouter.models;
  const timeoutPerAgent = config.openRouter.timeoutMs || 12000;
  const maxTotalTimeout = config.openRouter.maxTotalTimeoutMs || 40000;
  const cascadeStartTime = Date.now();

  const failedAttempts = [];

  // 1. Probar modelos de OpenRouter (Agente 1 y Agente 2)
  if (config.openRouter.apiKey) {
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const totalElapsed = Date.now() - cascadeStartTime;

      if (totalElapsed >= maxTotalTimeout) {
        console.error(`[Cascada AI] ⚠️ Tiempo total límite excedido (${Math.round(totalElapsed / 1000)}s >= ${maxTotalTimeout / 1000}s).`);
        break;
      }

      const remainingTime = maxTotalTimeout - totalElapsed;
      const currentTimeout = Math.min(timeoutPerAgent, remainingTime);

      console.log(`[Cascada AI] 🤖 [Agente ${i + 1}/${models.length + 1}] OpenRouter: "${model}" (Timeout: ${currentTimeout / 1000}s)...`);

      try {
        const result = await callOpenRouterModel({
          model,
          systemInstruction,
          prompt,
          isJson,
          timeoutMs: currentTimeout
        });

        console.log(`[Cascada AI] ✅ [Agente ${i + 1}] "${model}" respondió con éxito en ${result.durationMs}ms.`);
        return result;
      } catch (err) {
        failedAttempts.push({ agentNumber: i + 1, model, reason: err.message, durationMs: err.durationMs });
        console.warn(`[Cascada AI] ⚠️ [Agente ${i + 1}] "${model}" falló (${err.durationMs}ms): ${err.message}.`);
        console.log(`[Cascada AI] 🔄 Activando siguiente agente en cascada...`);
      }
    }
  }

  // 2. Probar Agente 3: Gemini Oficial de Google como respaldo
  const agent3Number = models.length + 1;
  const totalElapsedBeforeGemini = Date.now() - cascadeStartTime;
  const remainingForGemini = Math.max(1000, maxTotalTimeout - totalElapsedBeforeGemini);
  const geminiTimeout = Math.min(timeoutPerAgent, remainingForGemini);

  console.log(`[Cascada AI] 🤖 [Agente ${agent3Number}] Google Gemini Oficial: "${config.gemini.model}" (Timeout: ${geminiTimeout / 1000}s)...`);

  try {
    const geminiResult = await callGeminiOfficial({
      systemInstruction,
      prompt,
      isJson,
      timeoutMs: geminiTimeout
    });

    console.log(`[Cascada AI] ✅ [Agente ${agent3Number}] Google Gemini oficial respondió con éxito en ${geminiResult.durationMs}ms.`);
    return geminiResult;
  } catch (geminiErr) {
    failedAttempts.push({
      agentNumber: agent3Number,
      model: config.gemini.model,
      reason: geminiErr.message,
      durationMs: Date.now() - cascadeStartTime - totalElapsedBeforeGemini
    });
    console.warn(`[Cascada AI] ⚠️ [Agente ${agent3Number}] Gemini oficial no completó la solicitud: ${geminiErr.message}`);
  }

  const totalTime = Date.now() - cascadeStartTime;
  console.error(`[Cascada AI] ❌ Ningún agente de IA completó la respuesta tras ${Math.round(totalTime / 1000)}s. Resumen:`, failedAttempts);

  return null;
}

/**
 * Interpreta la intención del usuario y extrae parámetros de búsqueda
 */
export async function parseQueryWithAI(userMessage, currentContext) {
  const systemInstruction = `
Eres el módulo de extracción de intenciones con Inteligencia Artificial para el sistema de clientes de Vionest.
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

Tipos de intención (intent):
1. 'CLIENT_SEARCH': Busca una empresa por nombre o pregunta qué información hay sobre ella.
2. 'CLIENT_FIELD_QUERY': Pregunta por un campo específico de una empresa (por ejemplo: teléfono, demo, observaciones, investigador, fecha, ubicación, agente).
3. 'VERIFY_PHONE': Quiere verificar si un número telefónico existe o está verificado en la colección auxiliar/maestro.
4. 'SEARCH_BY_PHONE': Busca qué cliente o empresa tiene un número telefónico dado.
5. 'FILTER_QUERY': Busca o cuenta clientes por un filtro o criterio general. EJEMPLOS CLAVE:
   - "cuantos clientes tenemos de la zona de san diego" -> intent: 'FILTER_QUERY', filterField: 'Ubicación exacta', filterValue: 'San Diego'
   - "cuantos negocios estan a cargo del escuadron Cardenal" -> intent: 'FILTER_QUERY', filterField: 'Escuadrón Asignado', filterValue: 'Cardenal'
   - "quienes estan en estatus no interesado" -> intent: 'FILTER_QUERY', filterField: 'Estatus actual', filterValue: 'No interesado'
6. 'HELP_OR_GREETING': Saludo o pregunta sobre qué puede hacer el sistema.
7. 'UNKNOWN': No se relaciona con clientes ni consultas de la empresa.

Contexto actual:
${currentContext ? `Cliente seleccionado actualmente: ID "${currentContext.clientId}", Nombre "${currentContext.clientName}"` : 'Ningún cliente seleccionado actualmente.'}

Reglas:
- Sé sumamente permisivo. Si el usuario pregunta por zonas, municipios o ciudades (ej: "San Diego", "Valencia", "Naguanagua"), usa intent: 'FILTER_QUERY', filterField: 'Ubicación exacta' y en filterValue pon solo el nombre del lugar.
- Si pregunta por un escuadrón (ej: "escuadron Cardenal", "escuadrón 4"), en filterValue pon la palabra clave principal (ej: "Cardenal", "4").
- Si el usuario dice "su...", "del cliente", y hay cliente en contexto, marca "useCurrentContext": true.
- Devuelve SOLO el JSON sin texto extra ni etiquetas markdown.
`;

  try {
    const res = await generateWithFallback({
      systemInstruction,
      prompt: `Mensaje del usuario: "${userMessage}"`,
      isJson: true
    });

    if (!res || !res.text) return null;

    let cleaned = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[AI Intent Parser] No se pudo parsear JSON:', err.message);
    return null;
  }
}

/**
 * Redacta una respuesta conversacional fluida, inteligente y personalizada en español
 * utilizando EXCLUSIVAMENTE los datos fácticos recuperados de MongoDB.
 */
export async function draftResponseWithAI({ userMessage, retrievedData, queryType, currentClientName }) {
  const systemInstruction = `
Eres el asistente virtual de Inteligencia Artificial interno de Vionest.
Tu función es responder las dudas y preguntas del personal sobre la base de datos de clientes de manera inteligente, concisa, natural, comprensiva y profesional.

DIRECTRICES FUNDAMENTALES:
1. SÉ CONCISO Y DIRECTO: Ve al grano. Si el usuario pregunta por un dato concreto (por ejemplo, ubicación, teléfono, escuadrón, agente, demo o recuento), responde directamente lo solicitado con claridad.
2. PERMISIVO CON CONTEOS Y FILTROS: Si el usuario pregunta "cuántos clientes..." o "qué negocios...", indica el total exacto encontrado en la base de datos y lista los nombres o detalles más relevantes con cortesía.
3. BASADO 100% EN HECHOS: Usa exclusivamente la información provista en los datos de MongoDB. No inventes datos.
4. ENLACES Y URLs: Si hay enlaces relevantes (Instagram, demo, investigación), colócalos en formato markdown limpio [Nombre del recurso](URL).
5. CAMPOS NO ENCONTRADOS: Si un dato no figura en la base de datos, indícalo amablemente sin rodeos.
6. IDIOMA: Español claro y profesional.
`;

  const prompt = `
Pregunta del empleado: "${userMessage}"
Contexto de la consulta: ${queryType}
Empresa en contexto: ${currentClientName || 'Ninguna'}

DATOS DE MONGODB:
${JSON.stringify(retrievedData, null, 2)}

Responde al empleado de forma concisa, inteligente y contextualizada:`;

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
