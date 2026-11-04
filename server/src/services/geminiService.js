/**
 * Archivo de compatibilidad y reexportación.
 * El motor principal de Inteligencia Artificial ha migrado a OpenRouter
 * con sistema de cascada multi-agente y fallback secuencial.
 */
export {
  generateWithFallback,
  parseQueryWithAI as parseQueryWithGemini,
  draftResponseWithAI as draftResponseWithGemini
} from './openRouterService.js';
