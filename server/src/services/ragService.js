import MiniSearch from 'minisearch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClientesCollection } from '../db/mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_CLIENTES_PATH = path.resolve(__dirname, '../../data/backup_atlas/clientes.json');

let miniSearchInstance = null;
let clientsMap = new Map(); // id -> doc
let allClientsList = [];
let lastIndexTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutos de caché antes de reindexar de MongoDB

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
 * Carga los clientes:
 * 1. Primero intenta obtenerlos directamente desde MongoDB Atlas (producción / web)
 * 2. Si MongoDB no está listo, recurre al archivo local de backup
 */
async function loadClientsSource() {
  try {
    const col = getClientesCollection();
    if (col) {
      console.log('[RAG] 🌐 Obteniendo clientes en vivo desde MongoDB Atlas...');
      const docs = await col.find({}).toArray();
      if (docs && docs.length > 0) {
        console.log(`[RAG] ✅ Obtenidos ${docs.length} clientes desde MongoDB Atlas.`);
        return docs;
      }
    }
  } catch (dbErr) {
    console.warn('[RAG] No se pudo leer directamente de MongoDB, verificando respaldo local:', dbErr.message);
  }

  // Respaldo local si existe
  if (fs.existsSync(BACKUP_CLIENTES_PATH)) {
    try {
      console.log('[RAG] 📂 Cargando clientes desde respaldo local...');
      const raw = fs.readFileSync(BACKUP_CLIENTES_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (fsErr) {
      console.error('[RAG] Error al leer archivo local:', fsErr.message);
    }
  }

  return [];
}

/**
 * Construye e indexa en memoria los clientes para búsqueda ultra rápida.
 */
export async function initRAGIndex({ force = false } = {}) {
  const now = Date.now();
  if (miniSearchInstance && !force && (now - lastIndexTime < CACHE_TTL_MS)) {
    return miniSearchInstance;
  }

  console.log('[RAG] 🚀 Inicializando motor RAG semántico (BM25 + Ponderación)...');
  const startTime = Date.now();

  allClientsList = await loadClientsSource();

  if (!allClientsList || allClientsList.length === 0) {
    console.warn('[RAG] ⚠️ No se encontraron clientes para indexar.');
    return null;
  }

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
  lastIndexTime = Date.now();

  const duration = Date.now() - startTime;
  console.log(`[RAG] ✅ Índice RAG construido: ${documents.length} clientes listos en ${duration}ms.`);

  return miniSearchInstance;
}

/**
 * Búsqueda RAG Híbrida:
 * 1. Coincidencia directa en 'Nombre de la Empresa'
 * 2. Búsqueda semántica BM25 con MiniSearch
 */
export async function retrieveRelevantClients(userQuery, limit = 5) {
  const index = await initRAGIndex();
  if (!index) return [];

  const cleanQuery = normalizeForSearch(userQuery);
  if (!cleanQuery) return [];

  const terms = cleanQuery
    .split(/\s+/)
    .filter(w => !SPANISH_STOP_WORDS.has(w) && w.length >= 2);

  const directMatches = [];

  // 1. Coincidencia directa en 'Nombre de la Empresa'
  for (const c of allClientsList) {
    const normName = normalizeForSearch(c['Nombre de la Empresa']);
    if (!normName) continue;

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

  // 2. Búsqueda BM25 semántica
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
 * Filtro semántico por Escuadrón o Zona directamente desde los datos sincronizados
 */
export async function filterClientsByCriteria({ field, value, limit = 50 }) {
  await initRAGIndex();
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
