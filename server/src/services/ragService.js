import MiniSearch from 'minisearch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_CLIENTES_PATH = path.resolve(__dirname, '../../data/backup_atlas/clientes.json');

let miniSearchInstance = null;
let clientsMap = new Map(); // id -> doc
let allClientsList = [];

// Stop words comunes en español para no contaminar el scoring semántico
const SPANISH_STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'e', 'o', 'u', 'que', 'en', 'para', 'por', 'con', 'sin',
  'sobre', 'entre', 'del', 'al', 'cual', 'cuales', 'es', 'son',
  'como', 'donde', 'cuando', 'quien', 'quienes', 'dime', 'saber',
  'quiero', 'necesito', 'porfavor', 'favor', 'informacion', 'datos'
]);

/**
 * Normaliza texto para búsqueda: minúsculas, sin acentos ni caracteres especiales
 */
export function normalizeForSearch(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Construye e indexa en memoria los 1.737 clientes de Vionest.
 */
export function initRAGIndex() {
  if (miniSearchInstance) {
    return miniSearchInstance;
  }

  if (!fs.existsSync(BACKUP_CLIENTES_PATH)) {
    console.warn(`[RAG] Archivo no encontrado: ${BACKUP_CLIENTES_PATH}`);
    return null;
  }

  console.log('[RAG] 🚀 Inicializando motor RAG semántico (BM25 + Ponderación)...');
  const startTime = Date.now();

  const raw = fs.readFileSync(BACKUP_CLIENTES_PATH, 'utf-8');
  allClientsList = JSON.parse(raw);

  miniSearchInstance = new MiniSearch({
    idField: 'id',
    fields: [
      'nombreEmpresa',
      'escuadron',
      'ubicacion',
      'estatus',
      'telefono',
      'contacto',
      'observaciones',
      'feedback',
      'fullText'
    ],
    storeFields: ['id', 'nombreEmpresa', 'escuadron', 'ubicacion', 'telefono'],
    searchOptions: {
      boost: {
        nombreEmpresa: 10,
        escuadron: 4,
        ubicacion: 4,
        contacto: 2,
        feedback: 3,
        observaciones: 2,
        fullText: 1
      },
      fuzzy: 0.2,
      prefix: true
    },
    tokenize: (string) => normalizeForSearch(string).split(/\s+/).filter(w => !SPANISH_STOP_WORDS.has(w) && w.length > 1)
  });

  const documents = [];
  clientsMap.clear();

  for (let i = 0; i < allClientsList.length; i++) {
    const c = allClientsList[i];
    const id = c._id?.$oid || c._id?.toString() || `doc_${i}`;

    clientsMap.set(id, c);

    const fullText = [
      c['Nombre de la Empresa'] || '',
      c['Escuadrón Asignado'] || '',
      c['Ubicación exacta'] || '',
      c['Estatus actual'] || '',
      c['Número telefónico'] || '',
      c['Contacto Principal'] || '',
      c['Investigador Asignado'] || '',
      c['Halcón Asignado'] || '',
      c['Observaciones'] || '',
      c['Feedback Llamada'] || '',
      c['Feedback de la cita'] || '',
      c['instagram'] || ''
    ].join(' ');

    documents.push({
      id,
      nombreEmpresa: c['Nombre de la Empresa'] || '',
      escuadron: c['Escuadrón Asignado'] || '',
      ubicacion: c['Ubicación exacta'] || '',
      estatus: c['Estatus actual'] || '',
      telefono: c['Número telefónico'] || '',
      contacto: c['Contacto Principal'] || '',
      observaciones: c['Observaciones'] || '',
      feedback: c['Feedback Llamada'] || '',
      fullText
    });
  }

  miniSearchInstance.addAll(documents);

  const duration = Date.now() - startTime;
  console.log(`[RAG] ✅ Índice RAG construido: ${documents.length} clientes listos en ${duration}ms.`);

  return miniSearchInstance;
}

/**
 * Búsqueda RAG Híbrida:
 * 1. Búsqueda exacta de subcadena en nombres de empresas (prioridad máxima)
 * 2. Búsqueda semántica BM25 con MiniSearch sin ruido de stop words
 * 3. Filtros especializados para Escuadrón y Ubicación
 */
export function retrieveRelevantClients(userQuery, limit = 5) {
  const index = initRAGIndex();
  if (!index) return [];

  const cleanQuery = normalizeForSearch(userQuery);
  if (!cleanQuery) return [];

  // Extraer términos significativos quitando stop words
  const terms = cleanQuery
    .split(/\s+/)
    .filter(w => !SPANISH_STOP_WORDS.has(w) && w.length >= 2);

  const directMatches = [];

  // 1. Paso rápido: Coincidencia directa en 'Nombre de la Empresa'
  // Si el usuario dijo "Aceite Rogil" o "Torgus", buscar si alguna empresa contiene esos términos
  for (const c of allClientsList) {
    const normName = normalizeForSearch(c['Nombre de la Empresa']);
    if (!normName) continue;

    // Si coincide frase completa o término raro (ej: "rogil", "torgus", "embragues valero")
    if (cleanQuery.includes(normName) || (normName.length > 4 && cleanQuery.includes(normName))) {
      directMatches.push({ score: 9999, doc: c, matchType: 'EXACT_NAME' });
      continue;
    }

    const matchedTerms = terms.filter(t => normName.includes(t) && t.length >= 4);
    if (matchedTerms.length >= 2 || (matchedTerms.length === 1 && matchedTerms[0].length >= 5)) {
      directMatches.push({ score: 5000 + matchedTerms.length * 100, doc: c, matchType: 'STRONG_PARTIAL' });
    }
  }

  if (directMatches.length > 0) {
    directMatches.sort((a, b) => b.score - a.score);
    return directMatches.slice(0, limit);
  }

  // 2. Paso BM25 semántico con MiniSearch
  const searchResults = index.search(terms.join(' '));

  if (searchResults.length === 0 && terms.length > 0) {
    const fallbackResults = index.search(terms.join(' OR '));
    return fallbackResults.slice(0, limit).map(r => ({
      score: r.score,
      doc: clientsMap.get(r.id),
      matchType: 'BM25_FALLBACK'
    }));
  }

  return searchResults.slice(0, limit).map(r => ({
    score: r.score,
    doc: clientsMap.get(r.id),
    matchType: 'BM25_SEMANTIC'
  }));
}

/**
 * Filtro semántico por Escuadrón o Zona (ideal para conteos)
 */
export function filterClientsByCriteria({ field, value, limit = 50 }) {
  initRAGIndex();
  const normVal = normalizeForSearch(value);

  const matched = allClientsList.filter(c => {
    let target = '';
    if (field === 'Escuadrón Asignado') {
      target = normalizeForSearch(c['Escuadrón Asignado']);
    } else if (field === 'Ubicación exacta') {
      target = normalizeForSearch(c['Ubicación exacta']);
    } else if (field === 'Estatus actual') {
      target = normalizeForSearch(c['Estatus actual']);
    }
    return target.includes(normVal);
  });

  return {
    total: matched.length,
    results: matched.slice(0, limit)
  };
}
