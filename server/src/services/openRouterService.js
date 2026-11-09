import { config } from '../config/index.js';
import { GoogleGenAI } from '@google/genai';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/chat/completions';

/**
 * Realiza una llamada al modelo oficial de DeepSeek (Agente 1 Principal)
 */
async function callDeepSeekModel({ systemInstruction, prompt, isJson, timeoutMs }) {
  if (!config.deepseek.apiKey) {
    throw new Error('DEEPSEEK_API_KEY no configurada');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error(`Timeout de ${timeoutMs / 1000}s excedido para DeepSeek`));
  }, timeoutMs);

  const startTime = Date.now();

  try {
    const messages = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt }
    ];

    const bodyPayload = {
      model: config.deepseek.model || 'deepseek-chat',
      messages,
      temperature: isJson ? 0.1 : 0.3
    };

    if (isJson) {
      bodyPayload.response_format = { type: 'json_object' };
    }

    const res = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.deepseek.apiKey}`,
        'Content-Type': 'application/json'
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
      throw new Error('Respuesta vacía de DeepSeek');
    }

    const durationMs = Date.now() - startTime;
    return { text: content.trim(), modelUsed: `deepseek/${config.deepseek.model}`, durationMs };
  } catch (err) {
    clearTimeout(timer);
    const durationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || err.message?.includes('Timeout');
    throw {
      isTimeout,
      model: 'deepseek-chat',
      durationMs,
      message: isTimeout ? `Timeout excedido (${timeoutMs / 1000}s)` : err.message
    };
  }
}

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
 * 1. Agente 1: DeepSeek Oficial (deepseek-chat)
 * 2. Agente 2: OpenRouter (liquid/lfm-3-1.7b:free / dots-studio/dots-3-note-preview:free)
 * 3. Agente 3: Google Gemini Oficial (gemini-3.8-flash)
 */
export async function generateWithFallback({ systemInstruction, prompt, isJson = false }) {
  const models = config.openRouter.models;
  const timeoutPerAgent = config.openRouter.timeoutMs || 12000;
  const maxTotalTimeout = config.openRouter.maxTotalTimeoutMs || 40000;
  const cascadeStartTime = Date.now();

  const failedAttempts = [];

  // ==========================================
  // 1. Probar Agente 1: DeepSeek Oficial
  // ==========================================
  if (config.deepseek.apiKey) {
    const elapsed = Date.now() - cascadeStartTime;
    const remainingTime = Math.max(1000, maxTotalTimeout - elapsed);
    const deepseekTimeout = Math.min(config.deepseek.timeoutMs || timeoutPerAgent, remainingTime);

    console.log(`[Cascada AI] 🤖 [Agente 1 - Principal] DeepSeek: "${config.deepseek.model}" (Timeout: ${deepseekTimeout / 1000}s)...`);

    try {
      const result = await callDeepSeekModel({
        systemInstruction,
        prompt,
        isJson,
        timeoutMs: deepseekTimeout
      });

      console.log(`[Cascada AI] ✅ [Agente 1] DeepSeek respondió con éxito en ${result.durationMs}ms.`);
      return result;
    } catch (err) {
      failedAttempts.push({ agentNumber: 1, model: 'deepseek-chat', reason: err.message, durationMs: err.durationMs });
      console.warn(`[Cascada AI] ⚠️ [Agente 1] DeepSeek no completó la solicitud (${err.durationMs}ms): ${err.message}.`);
      console.log(`[Cascada AI] 🔄 Saltando al siguiente agente de respaldo...`);
    }
  }

  // ==========================================
  // 2. Probar Agente 2: Modelos de OpenRouter
  // ==========================================
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

      console.log(`[Cascada AI] 🤖 [Agente 2.${i + 1}] OpenRouter: "${model}" (Timeout: ${currentTimeout / 1000}s)...`);

      try {
        const result = await callOpenRouterModel({
          model,
          systemInstruction,
          prompt,
          isJson,
          timeoutMs: currentTimeout
        });

        console.log(`[Cascada AI] ✅ [Agente 2.${i + 1}] "${model}" respondió con éxito en ${result.durationMs}ms.`);
        return result;
      } catch (err) {
        failedAttempts.push({ agentNumber: `2.${i + 1}`, model, reason: err.message, durationMs: err.durationMs });
        console.warn(`[Cascada AI] ⚠️ [Agente 2.${i + 1}] "${model}" falló (${err.durationMs}ms): ${err.message}.`);
        console.log(`[Cascada AI] 🔄 Activando siguiente agente en cascada...`);
      }
    }
  }

  // ==========================================
  // 3. Probar Agente 3: Gemini Oficial de Google
  // ==========================================
  if (config.gemini.apiKey) {
    const totalElapsedBeforeGemini = Date.now() - cascadeStartTime;
    const remainingForGemini = Math.max(1000, maxTotalTimeout - totalElapsedBeforeGemini);
    const geminiTimeout = Math.min(timeoutPerAgent, remainingForGemini);

    console.log(`[Cascada AI] 🤖 [Agente 3 - Respaldo] Google Gemini Oficial: "${config.gemini.model}" (Timeout: ${geminiTimeout / 1000}s)...`);

    try {
      const geminiResult = await callGeminiOfficial({
        systemInstruction,
        prompt,
        isJson,
        timeoutMs: geminiTimeout
      });

      console.log(`[Cascada AI] ✅ [Agente 3] Google Gemini oficial respondió con éxito en ${geminiResult.durationMs}ms.`);
      return geminiResult;
    } catch (geminiErr) {
      failedAttempts.push({
        agentNumber: 3,
        model: config.gemini.model,
        reason: geminiErr.message,
        durationMs: Date.now() - cascadeStartTime - totalElapsedBeforeGemini
      });
      console.warn(`[Cascada AI] ⚠️ [Agente 3] Gemini oficial no completó la solicitud: ${geminiErr.message}`);
    }
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
Eres el motor de análisis y comprensión de lenguaje natural para la base de datos de clientes de Vionest.
Tu misión es analizar el mensaje del usuario en español y extraer con máxima precisión la intención y las entidades involucradas.

DEBES DEVOLVER EXCLUSIVAMENTE UN OBJETO JSON VÁLIDO CON ESTA ESTRUCTURA:
{
  "intent": "CLIENT_QUERY" | "FILTER_QUERY" | "SEARCH_BY_PHONE" | "VERIFY_PHONE" | "HELP_OR_GREETING" | "UNKNOWN",
  "companyName": string | null,
  "useCurrentContext": boolean,
  "requestedField": string | null,
  "filterField": string | null,
  "filterValue": string | null,
  "phoneNumber": string | null
}

Contexto actual de la conversación:
${currentContext ? `Cliente activo: "${currentContext.clientName}" (ID: ${currentContext.clientId})` : 'Ningún cliente en contexto.'}

Responde ÚNICAMENTE el objeto JSON.
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
Eres el asistente virtual con Inteligencia Artificial interno de Vionest para el personal autorizado.
Tu rol es responder a las preguntas de los empleados sobre la base de datos de clientes de manera inteligente, concisa, natural, conversacional y 100% verídica basada en los datos provistos de MongoDB.

DIRECTRICES:
1. RESPONDE CON EXACTITUD A LO QUE PREGUNTARON:
   - Si el usuario preguntó por la ubicación, dile directamente dónde queda ubicado.
   - Si preguntó por el feedback de la llamada, dale el feedback registrado de forma natural.
   - Si preguntó cuántos clientes/negocios tiene a cargo un escuadrón o zona, dale el número total exacto y menciona los clientes encontrados.
   - Si preguntó por la red social o Instagram, dale el enlace correspondiente [Instagram](URL).
2. NO USES PLANTILLAS PREVIAS NI VOLCADOS EN BRUTO: Habla con naturalidad y profesionalismo.
3. BASADO 100% EN HECHOS: Usa exclusivamente la información provista en los datos de MongoDB. Si un dato no figura, dilo con naturalidad sin inventar.
4. IDIOMA: Español fluido y profesional.
`;

  const prompt = `
Pregunta del empleado: "${userMessage}"
Contexto: ${queryType}
Empresa en contexto: ${currentClientName || 'Ninguna'}

DATOS REALES DE MONGODB:
${JSON.stringify(retrievedData, null, 2)}

Redacta tu respuesta concisa y profesional para el empleado:`;

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
