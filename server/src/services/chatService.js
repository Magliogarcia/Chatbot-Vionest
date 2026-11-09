import {
  searchClientsByName,
  getClientById,
  searchClientByPhone,
  verifyPhoneNumber,
  queryClientsByFilter
} from '../models/clientQuery.js';
import {
  getUserConversationById,
  createConversation,
  addMessageToConversation,
  updateConversationTitle
} from '../models/conversationModel.js';
import {
  parseOptionSelection,
  parseDeterministicQuery,
  formatMatchesDisambiguation,
  formatClientDetailsResponse
} from './deterministicParser.js';
import { parseQueryWithAI, draftResponseWithAI } from './openRouterService.js';
import { retrieveRelevantClients, filterClientsByCriteria } from './ragService.js';
import { config } from '../config/index.js';

export async function processChatMessage({ userId, conversationId, messageText }) {
  const cleanInput = (messageText || '').trim();
  if (!cleanInput) {
    throw new Error('El mensaje no puede estar vacío.');
  }

  // 1. Obtener o crear conversación garantizando el aislamiento de usuario
  let conversation = null;
  let isNewConversation = false;

  if (conversationId) {
    conversation = await getUserConversationById(conversationId, userId);
  }

  if (!conversation) {
    const titleSnippet = cleanInput.length > 35 ? `${cleanInput.slice(0, 35)}...` : cleanInput;
    conversation = await createConversation(userId, titleSnippet);
    isNewConversation = true;
  }

  const currentContext = conversation.currentClientContext || null;
  let updatedContext = currentContext ? { ...currentContext } : null;

  let assistantText = '';
  let returnedMatches = null;

  // 2. Comprobar si el usuario está seleccionando de una lista previa de desambiguación (ej: "1", "la 2")
  if (currentContext?.pendingMatches?.length > 0) {
    const selected = parseOptionSelection(cleanInput, currentContext.pendingMatches);
    if (selected) {
      let clientDoc = null;
      if (selected._id) {
        clientDoc = await getClientById(selected._id);
      }
      if (!clientDoc && selected.doc) {
        clientDoc = selected.doc;
      }

      if (clientDoc) {
        updatedContext = {
          clientId: String(clientDoc._id?.$oid || clientDoc._id?.toString() || clientDoc.id || clientDoc._id || ''),
          clientName: clientDoc['Nombre de la Empresa'],
          pendingMatches: null
        };

        const aiResponse = await draftResponseWithAI({
          userMessage: cleanInput,
          retrievedData: clientDoc,
          queryType: 'CLIENT_DETAILS',
          currentClientName: clientDoc['Nombre de la Empresa']
        });

        if (aiResponse) {
          assistantText = aiResponse;
        }
      }
    }
  }

  // 3. Procesar consulta con RAG Pipeline y Soporte Contextual
  if (!assistantText) {
    const detIntent = parseDeterministicQuery(cleanInput, updatedContext);

    // A. Saludo o Ayuda general inmediata
    if (detIntent.intent === 'HELP_OR_GREETING') {
      assistantText = await draftResponseWithAI({
        userMessage: cleanInput,
        retrievedData: {
          sistema: 'Vionest Chatbot Interno de Clientes (con motor RAG)',
          alcance: 'Consulta conversacional precisa de 1.737 clientes en MongoDB.'
        },
        queryType: 'GREETING',
        currentClientName: updatedContext?.clientName || null
      });

      if (!assistantText) {
        assistantText = '¡Hola! Soy el asistente virtual de la base de datos de Vionest. Puedes consultarme datos de cualquier cliente, teléfono, escuadrón o zona.';
      }
    }

    // B. Verificación o búsqueda de teléfono
    else if (detIntent.intent === 'VERIFY_PHONE' || detIntent.intent === 'SEARCH_BY_PHONE') {
      const phone = detIntent.phoneNumber;
      if (phone) {
        if (detIntent.intent === 'VERIFY_PHONE') {
          const verifResult = await verifyPhoneNumber(phone);
          assistantText = await draftResponseWithAI({
            userMessage: cleanInput,
            retrievedData: { telefonoConsultado: phone, ...verifResult },
            queryType: 'PHONE_VERIFICATION',
            currentClientName: updatedContext?.clientName || null
          });
        } else {
          const docs = await searchClientByPhone(phone);
          assistantText = await draftResponseWithAI({
            userMessage: cleanInput,
            retrievedData: { telefonoConsultado: phone, totalEncontrados: docs.length, clientes: docs },
            queryType: 'SEARCH_BY_PHONE',
            currentClientName: updatedContext?.clientName || null
          });
        }
      }
    }

    // C. Si la consulta es un filtro/conteo general (ej: escuadrón, zona)
    else if (detIntent.intent === 'FILTER_QUERY' && detIntent.filterField && detIntent.filterValue) {
      console.log(`[RAG Pipeline] 📊 Ejecutando filtro prioritario para: ${detIntent.filterField} = "${detIntent.filterValue}"`);
      const filterRes = await filterClientsByCriteria({ field: detIntent.filterField, value: detIntent.filterValue, limit: 10 });

      assistantText = await draftResponseWithAI({
        userMessage: cleanInput,
        retrievedData: {
          criterio: `${detIntent.filterField}: ${detIntent.filterValue}`,
          totalEncontrados: filterRes.total,
          ejemplosNegocios: filterRes.results.slice(0, 5).map(c => ({
            nombre: c['Nombre de la Empresa'],
            ubicacion: c['Ubicación exacta'] || 'No especificada',
            escuadron: c['Escuadrón Asignado'] || 'No especificado'
          }))
        },
        queryType: 'FILTER_RESULTS',
        currentClientName: null
      });

      if (!assistantText) {
        assistantText = `Se encontraron **${filterRes.total}** empresas con **${detIntent.filterField}: "${detIntent.filterValue}"**:\n\n` +
          filterRes.results.slice(0, 10).map((c, i) => `**${i + 1}.** ${c['Nombre de la Empresa']} (${c['Ubicación exacta'] || 'Sin ubicación'})`).join('\n');
      }
    }

    // D. Verificación del Cliente en Contexto Activo
    // Si ya hay un cliente fijado en la barra azul (ej: "rodamientos m & e"), y la pregunta es sobre él o coincide con su nombre
    if (!assistantText && updatedContext?.clientId && updatedContext?.clientName) {
      const normInput = cleanInput.toLowerCase();
      const normContextName = updatedContext.clientName.toLowerCase();
      
      // Palabras significativas del nombre en contexto
      const contextKeywords = normContextName.split(/[\s&,-]+/).filter(w => w.length >= 3);
      const isReferencingContext = contextKeywords.some(w => normInput.includes(w)) ||
        normInput.includes('su ') || normInput.includes('de ellos') || normInput.includes('de el') ||
        normInput.includes('ubicacion') || normInput.includes('telefono') || normInput.includes('contacto') ||
        normInput.includes('feedback') || normInput.includes('que sabes') || normInput.includes('cuentame');

      if (isReferencingContext) {
        console.log(`[RAG Context] 🎯 Usando cliente activo en contexto: "${updatedContext.clientName}"`);
        const contextDoc = await getClientById(updatedContext.clientId);
        if (contextDoc) {
          assistantText = await draftResponseWithAI({
            userMessage: cleanInput,
            retrievedData: contextDoc,
            queryType: 'CLIENT_DETAILS',
            currentClientName: contextDoc['Nombre de la Empresa']
          });

          if (!assistantText) {
            assistantText = formatClientDetailsResponse(contextDoc);
          }
        }
      }
    }

    // E. Recuperación RAG de Empresas y Términos Semánticos
    if (!assistantText) {
      console.log(`[RAG Pipeline] Ejecutando recuperación para: "${cleanInput}"`);
      const ragMatches = await retrieveRelevantClients(cleanInput, 5);

      if (ragMatches.length > 0) {
        // Caso E.1: Coincidencia de alta confianza (Nombre exacto o muy fuerte)
        if (ragMatches[0].score >= 5000 || ragMatches[0].matchType === 'EXACT_NAME') {
          const topClient = ragMatches[0].doc;
          console.log(`[RAG Pipeline] 🎯 Coincidencia de alta confianza encontrada: "${topClient['Nombre de la Empresa']}"`);

          updatedContext = {
            clientId: String(topClient._id?.$oid || topClient._id?.toString() || topClient.id || topClient._id || ''),
            clientName: topClient['Nombre de la Empresa'],
            pendingMatches: null
          };

          assistantText = await draftResponseWithAI({
            userMessage: cleanInput,
            retrievedData: topClient,
            queryType: 'CLIENT_DETAILS',
            currentClientName: topClient['Nombre de la Empresa']
          });

          if (!assistantText) {
            assistantText = formatClientDetailsResponse(topClient);
          }
        }
        // Caso E.2: Coincidencias múltiples relevantes (ej: varias empresas de rodamientos)
        else {
          console.log(`[RAG Pipeline] 💡 Pasando ${ragMatches.length} documentos recuperados a la IA`);
          const candidates = ragMatches.map(r => r.doc);

          // Si una sola empresa destaca fuertemente
          if (ragMatches.length === 1 || (ragMatches[0].score > (ragMatches[1]?.score || 0) * 1.5)) {
            const singleDoc = ragMatches[0].doc;
            updatedContext = {
              clientId: String(singleDoc._id?.$oid || singleDoc._id?.toString() || singleDoc.id || singleDoc._id || ''),
              clientName: singleDoc['Nombre de la Empresa'],
              pendingMatches: null
            };

            assistantText = await draftResponseWithAI({
              userMessage: cleanInput,
              retrievedData: singleDoc,
              queryType: 'CLIENT_DETAILS',
              currentClientName: singleDoc['Nombre de la Empresa']
            });

            if (!assistantText) {
              assistantText = formatClientDetailsResponse(singleDoc);
            }
          } else {
            // Múltiples empresas relevantes: pasarlas a la IA para que desglose o informe
            assistantText = await draftResponseWithAI({
              userMessage: cleanInput,
              retrievedData: {
                totalCoincidencias: candidates.length,
                empresasEncontradas: candidates.map(c => ({
                  nombre: c['Nombre de la Empresa'],
                  ubicacion: c['Ubicación exacta'] || 'No especificada',
                  escuadron: c['Escuadrón Asignado'] || 'No especificado',
                  telefono: c['Número telefónico'] || 'No especificado'
                }))
              },
              queryType: 'SEMANTIC_MATCHES',
              currentClientName: updatedContext?.clientName || null
            });

            if (!assistantText) {
              assistantText = formatMatchesDisambiguation(candidates.map(c => ({
                id: c._id?.toString(),
                nombreEmpresa: c['Nombre de la Empresa'],
                telefono: c['Número telefónico'],
                ubicacion: c['Ubicación exacta']
              })));
            }
          }
        }
      }
    }

    // F. Fallback asistido por IA si no hubo coincidencias
    if (!assistantText) {
      assistantText = await draftResponseWithAI({
        userMessage: cleanInput,
        retrievedData: {
          mensaje: 'No se encontraron registros en la base de datos que coincidan con la consulta.',
          consulta: cleanInput,
          contextoActivo: updatedContext?.clientName || null
        },
        queryType: 'NOT_FOUND',
        currentClientName: updatedContext?.clientName || null
      });

      if (!assistantText) {
        assistantText = 'No encontré registros en la base de datos de Vionest que coincidan con tu búsqueda. Puedes especificar el nombre de la empresa, el escuadrón o la ubicación.';
      }
    }
  }

  // 4. Persistir mensaje del usuario y respuesta del asistente
  const targetConvId = (conversation._id || conversation.id || conversationId).toString();

  await addMessageToConversation(targetConvId, {
    sender: 'user',
    text: cleanInput
  });

  const savedAssistantMsg = await addMessageToConversation(
    targetConvId,
    {
      sender: 'assistant',
      text: assistantText,
      returnedMatches
    },
    updatedContext
  );

  if (isNewConversation && updatedContext?.clientName) {
    await updateConversationTitle(targetConvId, `Consulta: ${updatedContext.clientName}`);
  }

  return {
    conversationId: targetConvId,
    userMessage: {
      text: cleanInput,
      createdAt: new Date()
    },
    assistantMessage: {
      id: savedAssistantMsg?.id || Date.now().toString(),
      text: assistantText,
      returnedMatches,
      createdAt: savedAssistantMsg?.createdAt || new Date()
    },
    currentContext: updatedContext
  };
}
