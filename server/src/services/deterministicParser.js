import { cleanPhoneNumber, normalizeText } from '../models/clientQuery.js';

/**
 * Detecta si el usuario está seleccionando una opción numérica de una lista previa
 */
export function parseOptionSelection(text, pendingMatches) {
  if (!pendingMatches || pendingMatches.length === 0) return null;

  const clean = text.toLowerCase().trim();

  // Coincidencias como: "1", "la 1", "opcion 1", "opción 2", "el número 3", "primera", "segunda"
  const numMatch = clean.match(/(?:opci[oó]n|el\s+n[uú]mero|la|el)?\s*#?\s*([0-9]+)/i);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (idx >= 0 && idx < pendingMatches.length) {
      return pendingMatches[idx];
    }
  }

  // Palabras ordinales
  const ordinals = {
    'primero': 0, 'primera': 0, '1ro': 0, '1ra': 0,
    'segundo': 1, 'segunda': 1, '2do': 1, '2da': 1,
    'tercero': 2, 'tercera': 2, '3ro': 2, '3ra': 2,
    'cuarto': 3, 'cuarta': 3,
    'quinto': 4, 'quinta': 4
  };

  for (const [word, idx] of Object.entries(ordinals)) {
    if (clean.includes(word) && idx < pendingMatches.length) {
      return pendingMatches[idx];
    }
  }

  return null;
}

/**
 * Extractor determinista de consultas en lenguaje natural en español
 */
export function parseDeterministicQuery(message, currentContext) {
  const norm = normalizeText(message);
  const cleanPhone = cleanPhoneNumber(message);

  // 1. Saludos y ayuda
  if (/^(hola|buenos dias|buenas tardes|buenas noches|que puedes hacer|ayuda|menu)$/i.test(norm)) {
    return {
      intent: 'HELP_OR_GREETING'
    };
  }

  // 2. Verificación de teléfono
  if (norm.includes('verificacion') || norm.includes('verificar') || norm.includes('verificado') || norm.includes('esta registrado')) {
    if (cleanPhone && cleanPhone.length >= 7) {
      return {
        intent: 'VERIFY_PHONE',
        phoneNumber: message.match(/[\d\-]{7,15}/)?.[0] || cleanPhone
      };
    }
    if (currentContext) {
      return {
        intent: 'VERIFY_PHONE',
        useCurrentContext: true
      };
    }
  }

  // 3. Búsqueda por número telefónico
  if (cleanPhone && cleanPhone.length >= 7 && (norm.includes('telefono') || norm.includes('numero') || norm.includes('quien es') || norm.includes('de quien'))) {
    return {
      intent: 'SEARCH_BY_PHONE',
      phoneNumber: message.match(/[\d\-]{7,15}/)?.[0] || cleanPhone
    };
  }

  // 4. Filtro por Escuadrón
  const escuadronMatch = message.match(/escuadr[oó]n\s*([0-9a-zA-Z\s\(\)]+)/i);
  if (escuadronMatch) {
    const rawVal = escuadronMatch[0].trim();
    return {
      intent: 'FILTER_QUERY',
      filterField: 'Escuadrón Asignado',
      filterValue: rawVal
    };
  }

  // 5. Filtro por Estatus
  const statusKeywords = [
    'no interesado', 'no interesada', 'no interesados',
    'contactado', 'contactada',
    'cita agendada', 'cliente activo', 'prospecto',
    'propuesta enviada', 'por contactar'
  ];
  for (const st of statusKeywords) {
    if (norm.includes(normalizeText(st))) {
      // Verificar si pregunta por clientes con ese estatus
      if (norm.includes('clientes') || norm.includes('empresas') || norm.includes('quienes') || norm.includes('que tienen')) {
        return {
          intent: 'FILTER_QUERY',
          filterField: 'Estatus actual',
          filterValue: st
        };
      }
    }
  }

  // 6. Consultas sobre el cliente actualmente en contexto ("su telefono", "la demo", "observaciones")
  const contextIndicators = ['su ', 'de esa empresa', 'este cliente', 'esa empresa', 'del cliente', 'ultimo contacto', 'primer contacto'];
  const hasContextRef = contextIndicators.some(ci => norm.includes(normalizeText(ci)));

  if (currentContext && (hasContextRef || !norm.includes('empresa') && (
    norm.includes('telefono') || norm.includes('demo') || norm.includes('contacto') ||
    norm.includes('investigador') || norm.includes('observaciones') || norm.includes('estatus') ||
    norm.includes('ubicacion') || norm.includes('feedback') || norm.includes('contrato')
  ))) {
    return {
      intent: 'CLIENT_FIELD_QUERY',
      useCurrentContext: true,
      requestedField: extractRequestedField(norm)
    };
  }

  // 7. Búsqueda explícita de empresa: "¿Qué información tenemos de X?", "Busca la empresa X", "Información de X"
  const searchCompanyMatch = message.match(/(?:informaci[oó]n\s+(?:tenemos\s+)?(?:de|sobre)|busca(?:r)?\s+(?:a|la\s+empresa)?|datos\s+de|empresa)\s+([^\?\.\n]+)/i);
  if (searchCompanyMatch) {
    const extractedName = searchCompanyMatch[1].trim();
    if (extractedName.length > 2) {
      return {
        intent: 'CLIENT_SEARCH',
        companyName: extractedName
      };
    }
  }

  // Si no encaja exactamente, si parece un nombre de empresa directo:
  if (message.length > 3 && !message.includes('?')) {
    return {
      intent: 'CLIENT_SEARCH',
      companyName: message.trim()
    };
  }

  return {
    intent: 'UNKNOWN',
    originalText: message
  };
}

function extractRequestedField(norm) {
  if (norm.includes('telefono') || norm.includes('numero')) return 'Número telefónico';
  if (norm.includes('demo')) return 'URL Demo';
  if (norm.includes('repositorio')) return 'URL Repositorio';
  if (norm.includes('investigador')) return 'Investigador Asignado';
  if (norm.includes('observaciones')) return 'Observaciones';
  if (norm.includes('estatus')) return 'Estatus actual';
  if (norm.includes('escuadron')) return 'Escuadrón Asignado';
  if (norm.includes('contacto principal') || norm.includes('contacto')) return 'Contacto Principal';
  if (norm.includes('primer contacto')) return 'Fecha Primer Contacto';
  if (norm.includes('re contacto') || norm.includes('ultimo contacto')) return 'Fecha Re-Contacto';
  if (norm.includes('cita')) return 'Fecha de Cita';
  if (norm.includes('feedback llamada')) return 'Feedback Llamada';
  if (norm.includes('feedback cita') || norm.includes('feedback de la cita')) return 'Feedback de la cita';
  if (norm.includes('ubicacion')) return 'Ubicación exacta';
  if (norm.includes('instagram')) return 'instagram';
  if (norm.includes('contrato')) return 'URL Contrato';
  return null;
}

/**
 * Formateador de respuestas determinista y profesional
 */
export function formatClientDetailsResponse(clientDoc, requestedField = null) {
  const nombre = clientDoc['Nombre de la Empresa'] || 'Sin nombre registrado';

  // Si el usuario pidió un campo específico
  if (requestedField) {
    const val = clientDoc[requestedField];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return `Para **${nombre}**, el campo **${requestedField}** es: **${val}**.`;
    } else {
      return `Para **${nombre}**, el campo **${requestedField}** no tiene ningún valor registrado en la base de datos (se encuentra vacío).`;
    }
  }

  // Resumen general del cliente
  const lines = [
    `### Información de **${nombre}**`,
    `- **Estatus actual**: ${clientDoc['Estatus actual'] || 'No especificado'}`,
    `- **Escuadrón Asignado**: ${clientDoc['Escuadrón Asignado'] || 'No asignado'}`,
    `- **Número telefónico**: ${clientDoc['Número telefónico'] || 'No registrado'}`,
    `- **Contacto Principal**: ${clientDoc['Contacto Principal'] || 'No registrado'}`,
    `- **Ubicación exacta**: ${clientDoc['Ubicación exacta'] || 'No registrada'}`
  ];

  if (clientDoc['Investigador Asignado']) {
    lines.push(`- **Investigador Asignado**: ${clientDoc['Investigador Asignado']}`);
  }
  if (clientDoc['Halcón Asignado']) {
    lines.push(`- **Halcón Asignado**: ${clientDoc['Halcón Asignado']}`);
  }
  if (clientDoc['Fecha Primer Contacto']) {
    lines.push(`- **Fecha Primer Contacto**: ${clientDoc['Fecha Primer Contacto']}`);
  }
  if (clientDoc['Fecha Re-Contacto']) {
    lines.push(`- **Fecha Re-Contacto**: ${clientDoc['Fecha Re-Contacto']}`);
  }
  if (clientDoc['URL Demo']) {
    lines.push(`- **URL Demo**: [Ver Demo](${clientDoc['URL Demo']})`);
  }
  if (clientDoc['Observaciones']) {
    lines.push(`- **Observaciones**: ${clientDoc['Observaciones']}`);
  }

  lines.push('\n_Puedes consultar cualquier otro campo específico (ej: demo, llamadas, contrato, investigador) de este cliente._');

  return lines.join('\n');
}

/**
 * Formateador de lista de coincidencias múltiples (Sección 9)
 */
export function formatMatchesDisambiguation(matches) {
  const lines = [
    `He encontrado **${matches.length}** empresas que coinciden con tu búsqueda. Por favor selecciona el número de la empresa que deseas consultar:\n`
  ];

  matches.forEach((m, idx) => {
    const detalles = [];
    if (m.telefono) detalles.push(`Tel: ${m.telefono}`);
    if (m.ubicacion) detalles.push(`Ubicación: ${m.ubicacion}`);
    const extra = detalles.length > 0 ? ` (${detalles.join(' | ')})` : '';
    lines.push(`**${idx + 1}.** ${m.nombreEmpresa}${extra}`);
  });

  lines.push('\nEscribe el número correspondiente para ver la información detallada.');
  return lines.join('\n');
}

/**
 * Formateador de verificación de teléfono (Sección 4)
 */
export function formatPhoneVerificationResponse(verifResult, phone) {
  const lines = [`### Verificación del número: **${phone}**`];

  switch (verifResult.status) {
    case 'COINCIDENCIA_AMBAS':
      lines.push('✅ **Coincidencia en ambas colecciones:**');
      lines.push('- **Colección auxiliar (`clientes_telefonos_verificacion`)**: Registrado.');
      if (verifResult.detallesAuxiliar?.[0]) {
        const aux = verifResult.detallesAuxiliar[0];
        lines.push(`  - Empresa/Nombre en auxiliar: "${aux.nombreEmpresa}"`);
        lines.push(`  - Campo 'En maestro': **${aux.enMaestro}**`);
      }
      lines.push('- **Colección maestra (`clientes`)**: Registrado.');
      if (verifResult.detallesMaestro?.[0]) {
        const m = verifResult.detallesMaestro[0];
        lines.push(`  - Empresa en maestro: **${m.nombreEmpresa}**`);
        lines.push(`  - Estatus actual: ${m.estatusActual || 'Sin estatus'}`);
      }
      break;

    case 'ENCONTRADO_AUXILIAR':
      lines.push('⚠️ **Encontrado únicamente en la colección auxiliar:**');
      lines.push('- Está presente en `clientes_telefonos_verificacion`.');
      if (verifResult.detallesAuxiliar?.[0]) {
        const aux = verifResult.detallesAuxiliar[0];
        lines.push(`  - Nombre/Empresa asociado: "${aux.nombreEmpresa}"`);
        lines.push(`  - Valor de 'En maestro': **${aux.enMaestro}**`);
      }
      lines.push('- ❌ **NO** está registrado en la colección maestra de clientes.');
      break;

    case 'ENCONTRADO_MAESTRO':
      lines.push('ℹ️ **Encontrado únicamente en el maestro de clientes:**');
      lines.push('- Está registrado en la colección principal `clientes`.');
      if (verifResult.detallesMaestro?.[0]) {
        const m = verifResult.detallesMaestro[0];
        lines.push(`  - Empresa: **${m.nombreEmpresa}**`);
        lines.push(`  - Estatus: ${m.estatusActual || 'Sin estatus'}`);
      }
      lines.push('- ❌ **NO** figura en la colección auxiliar de verificación.');
      break;

    case 'NO_ENCONTRADO':
      lines.push('❌ **Número no encontrado:**');
      lines.push('El número no se encuentra registrado ni en la colección maestra de clientes ni en la colección auxiliar de verificación.');
      break;

    case 'INDETERMINADO':
    default:
      lines.push('⚠️ **Resultado indeterminado:**');
      lines.push(verifResult.mensaje || 'No se pudo completar la verificación debido a datos insuficientes.');
      break;
  }

  return lines.join('\n');
}
