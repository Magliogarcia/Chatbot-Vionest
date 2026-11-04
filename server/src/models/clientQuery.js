import { ObjectId } from 'mongodb';
import { getClientesCollection, getVerificacionCollection } from '../db/mongo.js';

// Normaliza texto: minúsculas, sin tildes, sin caracteres especiales redundantes
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Limpia número de teléfono a solo dígitos
export function cleanPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
}

/**
 * Búsqueda inteligente de clientes por nombre de empresa (exacta, subcadena y similitud)
 * Retorna { exactMatch: doc | null, matches: [ ...resumen ] }
 */
export async function searchClientsByName(companyName) {
  const col = getClientesCollection();
  const trimmed = companyName.trim();
  if (!trimmed) return { exactMatch: null, matches: [] };

  // Limpiar sufijos corporativos comunes como C.A, S.A, SRL, etc.
  const cleanCorpName = trimmed
    .replace(/\b(?:c\.?a\.?|s\.?a\.?|s\.?r\.?l\.?|corp\.?|inc\.?)\b/gi, '')
    .replace(/[,\.]/g, '')
    .trim();

  const normQuery = normalizeText(cleanCorpName || trimmed);

  // 1. Intento de coincidencia exacta directa
  const escapedExact = cleanCorpName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exactDoc = await col.findOne({
    'Nombre de la Empresa': { $regex: new RegExp(`^\\s*${escapedExact}\\s*(?:c\\.?a\\.?|s\\.?a\\.?|srl)?\\s*$`, 'i') }
  });

  if (exactDoc) {
    return {
      exactMatch: exactDoc,
      matches: [{
        _id: exactDoc._id.toString(),
        nombreEmpresa: exactDoc['Nombre de la Empresa'],
        telefono: exactDoc['Número telefónico'] || '',
        ubicacion: exactDoc['Ubicación exacta'] || ''
      }]
    };
  }

  // 2. Búsqueda por palabras clave significativas
  const STOP_WORDS = new Set(['empresa', 'empresas', 'compania', 'corporacion', 'de', 'la', 'el', 'los', 'las', 'y', 'del', 'en', 'para', 'con', 'te', 'estoy', 'diciendo', 'que', 'pero', 'quiero', 'saber', 'donde', 'esta', 'ubicada', 'cual', 'es', 'el', 'feedback']);
  const allWords = normQuery.split(' ').filter(w => w.length > 1);
  const significantWords = allWords.filter(w => !STOP_WORDS.has(w) && w.length >= 3);
  const wordsToSearch = significantWords.length > 0 ? significantWords : allWords;

  if (wordsToSearch.length === 0) return { exactMatch: null, matches: [] };

  // Coincidir con todas las palabras clave simultáneas
  const regexPattern = wordsToSearch.map(w => `(?=.*${w})`).join('');
  const candidateDocs = await col.find({
    'Nombre de la Empresa': { $regex: new RegExp(regexPattern, 'i') }
  })
  .limit(20)
  .toArray();

  if (candidateDocs.length === 1) {
    return {
      exactMatch: candidateDocs[0],
      matches: [{
        _id: candidateDocs[0]._id.toString(),
        nombreEmpresa: candidateDocs[0]['Nombre de la Empresa'],
        telefono: candidateDocs[0]['Número telefónico'] || '',
        ubicacion: candidateDocs[0]['Ubicación exacta'] || ''
      }]
    };
  }

  // Si no hubo coincidencia simultánea con todas, buscar individualmente solo si hay palabra muy distintiva (>4 letras)
  let finalCandidates = candidateDocs;
  if (finalCandidates.length === 0 && wordsToSearch.length > 1) {
    const strongWords = wordsToSearch.filter(w => w.length >= 4);
    if (strongWords.length > 0) {
      const orPatterns = strongWords.map(w => ({
        'Nombre de la Empresa': { $regex: new RegExp(w, 'i') }
      }));
      finalCandidates = await col.find({ $or: orPatterns }).limit(20).toArray();
    }
  }

  // Calcular similitud/puntuación
  const scored = finalCandidates.map(doc => {
    const normName = normalizeText(doc['Nombre de la Empresa']);
    let score = 0;
    if (normName === normQuery) score += 100;
    if (normName.includes(normQuery)) score += 70;
    
    let matchedSigCount = 0;
    for (const w of wordsToSearch) {
      if (normName.includes(w)) {
        score += 30;
        matchedSigCount++;
      }
    }
    return { doc, score, matchedSigCount };
  })
  .filter(item => item.score >= 30 && item.matchedSigCount > 0)
  .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    // Si el primer candidato tiene una ventaja clara (score alto o coincidencia directa de término raro como Rogil o Torgus)
    const best = scored[0];
    if (best.score >= 80 || (scored.length === 1 && best.score >= 50)) {
      return {
        exactMatch: best.doc,
        matches: [{
          _id: best.doc._id.toString(),
          nombreEmpresa: best.doc['Nombre de la Empresa'],
          telefono: best.doc['Número telefónico'] || '',
          ubicacion: best.doc['Ubicación exacta'] || ''
        }]
      };
    }
  }

  const matches = scored.slice(0, 10).map(item => ({
    _id: item.doc._id.toString(),
    nombreEmpresa: item.doc['Nombre de la Empresa'],
    telefono: item.doc['Número telefónico'] || '',
    ubicacion: item.doc['Ubicación exacta'] || ''
  }));

  return {
    exactMatch: null,
    matches
  };
}

/**
 * Obtener detalles completos de un cliente por su _id
 */
export async function getClientById(clientId) {
  const col = getClientesCollection();
  let queryId;
  try {
    queryId = new ObjectId(clientId);
  } catch {
    return null;
  }
  return await col.findOne({ _id: queryId });
}

/**
 * Buscar cliente por número de teléfono en la colección principal
 */
export async function searchClientByPhone(phoneQuery) {
  const col = getClientesCollection();
  const digits = cleanPhoneNumber(phoneQuery);
  if (!digits || digits.length < 5) return [];

  const regex = new RegExp(digits.slice(-7));
  const results = await col.find({
    $or: [
      { 'Número telefónico': { $regex: new RegExp(phoneQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      { 'Número telefónico': { $regex: regex } }
    ]
  }).limit(10).toArray();

  return results;
}

/**
 * Verificación exhaustiva de un número de teléfono en ambas colecciones
 */
export async function verifyPhoneNumber(phone) {
  const clean = cleanPhoneNumber(phone);
  if (!clean || clean.length < 5) {
    return {
      status: 'INDETERMINADO',
      mensaje: 'El número proporcionado es insuficiente o inválido para realizar la verificación.',
      encontradoEnAuxiliar: false,
      encontradoEnMaestro: false,
      detallesAuxiliar: null,
      detallesMaestro: null
    };
  }

  const clientesCol = getClientesCollection();
  const verifCol = getVerificacionCollection();

  const suffix = clean.slice(-7);
  const regexSuffix = new RegExp(suffix);

  const auxMatches = await verifCol.find({
    $or: [
      { numero: { $regex: new RegExp(phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      { numero: { $regex: regexSuffix } }
    ]
  }).limit(5).toArray();

  const maestroMatches = await clientesCol.find({
    $or: [
      { 'Número telefónico': { $regex: new RegExp(phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
      { 'Número telefónico': { $regex: regexSuffix } }
    ]
  }).limit(5).toArray();

  const encontradoEnAuxiliar = auxMatches.length > 0;
  const encontradoEnMaestro = maestroMatches.length > 0;

  let status = 'NO_ENCONTRADO';
  let mensaje = 'El número no fue encontrado en ninguna de las colecciones.';

  if (encontradoEnAuxiliar && encontradoEnMaestro) {
    status = 'COINCIDENCIA_AMBAS';
    mensaje = 'El número coincide tanto en la colección auxiliar de verificación como en la colección maestra de clientes.';
  } else if (encontradoEnAuxiliar && !encontradoEnMaestro) {
    status = 'ENCONTRADO_AUXILIAR';
    mensaje = 'El número fue encontrado en la colección auxiliar de verificación, pero NO está registrado en la colección maestra de clientes.';
  } else if (!encontradoEnAuxiliar && encontradoEnMaestro) {
    status = 'ENCONTRADO_MAESTRO';
    mensaje = 'El número fue encontrado en la colección maestra de clientes, pero NO está registrado en la colección auxiliar de verificación.';
  }

  return {
    status,
    mensaje,
    encontradoEnAuxiliar,
    encontradoEnMaestro,
    detallesAuxiliar: auxMatches.map(m => ({
      _id: m._id.toString(),
      nombreEmpresa: m['Nombre / Empresa'],
      numero: m.numero,
      enMaestro: m['En maestro']
    })),
    detallesMaestro: maestroMatches.map(m => ({
      _id: m._id.toString(),
      nombreEmpresa: m['Nombre de la Empresa'],
      numero: m['Número telefónico'],
      estatusActual: m['Estatus actual'],
      escuadron: m['Escuadrón Asignado']
    }))
  };
}

/**
 * Consulta de clientes por filtros dinámicos y ultra permisivos sobre MongoDB.
 * Soporta cualquier campo: Escuadrón Asignado, Ubicación exacta, Estatus actual,
 * Investigador Asignado, Halcón Asignado, Observaciones, Feedback Llamada, etc.
 */
export async function queryClientsByFilter({ filterField, filterValue, limit = 40 }) {
  const col = getClientesCollection();
  let targetField = filterField || 'Escuadrón Asignado';
  let rawValue = String(filterValue || '').trim();

  // Mapeo amigable e inteligente de nombres de campo
  const normField = normalizeText(targetField);
  if (normField.includes('ubicacion') || normField.includes('zona') || normField.includes('ciudad') || normField.includes('estado') || normField.includes('direccion') || normField.includes('donde')) {
    targetField = 'Ubicación exacta';
  } else if (normField.includes('escuadron')) {
    targetField = 'Escuadrón Asignado';
  } else if (normField.includes('estatus') || normField.includes('estado')) {
    targetField = 'Estatus actual';
  } else if (normField.includes('halcon') || normField.includes('agente')) {
    targetField = 'Halcón Asignado';
  } else if (normField.includes('investigador')) {
    targetField = 'Investigador Asignado';
  } else if (normField.includes('contacto')) {
    targetField = 'Contacto Principal';
  } else if (normField.includes('observacion')) {
    targetField = 'Observaciones';
  } else if (normField.includes('feedback')) {
    targetField = 'Feedback Llamada';
  }

  // Limpieza y refinamiento de búsqueda para escuadrón:
  // "condor", "cóndor", "escuadron condor" -> regex que coincida con "Escuadrón 2 (Cóndor)"
  let regexCondition;

  if (targetField === 'Escuadrón Asignado') {
    let cleanVal = rawValue
      .replace(/^escuadr[oó]n\s*/i, '')
      .replace(/[\(\)]/g, '')
      .trim();

    // Mapeo de términos de escuadrones conocidos
    const normEsc = normalizeText(cleanVal);
    if (normEsc.includes('condor')) {
      regexCondition = /c[oó]ndor/i;
    } else if (normEsc.includes('cardenal')) {
      regexCondition = /cardenal/i;
    } else if (normEsc.includes('halcon')) {
      regexCondition = /halc[oó]n/i;
    } else if (normEsc.includes('aguila')) {
      regexCondition = /[aá]guila/i;
    } else if (/^\d+$/.test(cleanVal)) {
      regexCondition = new RegExp(`Escuadr[oó]n\\s*${cleanVal}`, 'i');
    } else {
      regexCondition = new RegExp(cleanVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
  } else if (targetField === 'Ubicación exacta') {
    let cleanLoc = rawValue
      .replace(/^(?:los\s+|las\s+|el\s+|la\s+)?(?:clientes\s+de\s+|negocios\s+de\s+|zona\s+de\s+|zona\s+|de\s+la\s+|de\s+|en\s+)/i, '')
      .trim();

    const tokens = cleanLoc.split(/\s+/).filter(t => t.length >= 3);
    if (tokens.length > 1) {
      const lookaheads = tokens.map(t => `(?=.*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('');
      regexCondition = new RegExp(lookaheads, 'i');
    } else if (tokens.length === 1) {
      regexCondition = new RegExp(tokens[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    } else {
      regexCondition = new RegExp(cleanLoc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
  } else {
    regexCondition = new RegExp(rawValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const query = {
    [targetField]: { $regex: regexCondition }
  };

  const total = await col.countDocuments(query);
  const docs = await col.find(query)
    .limit(Math.min(limit, 50))
    .project({
      _id: 1,
      'Nombre de la Empresa': 1,
      'Estatus actual': 1,
      'Escuadrón Asignado': 1,
      'Número telefónico': 1,
      'Contacto Principal': 1,
      'Ubicación exacta': 1,
      'Investigador Asignado': 1,
      'Halcón Asignado': 1,
      'Observaciones': 1,
      'Feedback Llamada': 1,
      'instagram': 1,
      'Correo electrónico': 1
    })
    .toArray();

  return {
    total,
    returned: docs.length,
    criterioBuscado: `${targetField}: "${rawValue}"`,
    campoConsultado: targetField,
    valorConsultado: rawValue,
    results: docs.map(d => ({
      _id: d._id.toString(),
      nombreEmpresa: d['Nombre de la Empresa'],
      estatus: d['Estatus actual'] || 'Sin estatus',
      escuadron: d['Escuadrón Asignado'] || 'Sin escuadrón',
      telefono: d['Número telefónico'] || 'Sin teléfono',
      contacto: d['Contacto Principal'] || 'Sin contacto',
      ubicacion: d['Ubicación exacta'] || 'Sin ubicación',
      investigador: d['Investigador Asignado'] || '',
      halcon: d['Halcón Asignado'] || '',
      observaciones: d['Observaciones'] || ''
    }))
  };
}
