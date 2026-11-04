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
  formatMatchesDisambiguation
} from './deterministicParser.js';
import { parseQueryWithAI, draftResponseWithAI } from './openRouterService.js';
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
      const clientDoc = await getClientById(selected._id);
      if (clientDoc) {
        updatedContext = {
          clientId: clientDoc._id.toString(),
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

  // 3. Procesar consulta principal con comprensión inteligente de la IA
  if (!assistantText) {
    // La IA analiza el mensaje primero para entender intención, empresa, escuadrón, etc.
    let aiPlan = null;
    if (config.openRouter.apiKey || config.gemini.apiKey) {
      aiPlan = await parseQueryWithAI(cleanInput, updatedContext);
    }

    // Fallback ligero determinista si la IA no estuviera disponible
    const detIntent = parseDeterministicQuery(cleanInput, updatedContext);
    const intent = aiPlan?.intent || detIntent.intent;

    // A. Saludo o Ayuda general
    if (intent === 'HELP_OR_GREETING') {
      const aiDraft = await draftResponseWithAI({
        userMessage: cleanInput,
        retrievedData: {
          sistema: 'Vionest Chatbot Interno de Clientes',
          alcance: 'Consulta conversacional de la base de datos de clientes en MongoDB.'
        },
        queryType: 'GREETING',
        currentClientName: updatedContext?.clientName || null
      });

      assistantText = aiDraft || '¡Hola! Soy el asistente virtual de la base de datos de Vionest. Puedes consultarme datos de cualquier cliente, teléfono, escuadrón o zona.';
    }

    // B. Verificación o búsqueda de teléfono
    else if (intent === 'VERIFY_PHONE' || intent === 'SEARCH_BY_PHONE') {
      const phone = aiPlan?.phoneNumber || detIntent.phoneNumber;
      if (phone) {
        if (intent === 'VERIFY_PHONE') {
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

    // C. Filtro o conteo por Escuadrón, Ubicación/Zona, Estatus, Halcón, etc.
    else if (intent === 'FILTER_QUERY' || aiPlan?.filterField || detIntent.filterField) {
      const filterField = aiPlan?.filterField || detIntent.filterField || 'Escuadrón Asignado';
      const filterValue = aiPlan?.filterValue || detIntent.filterValue || '';

      const filterRes = await queryClientsByFilter({ filterField, filterValue, limit: 30 });
      assistantText = await draftResponseWithAI({
        userMessage: cleanInput,
        retrievedData: filterRes,
        queryType: 'FILTER_RESULTS',
        currentClientName: null
      });
    }

    // D. Consulta sobre una Empresa (o empresa en contexto)
    if (!assistantText) {
      // Determinar qué empresa buscar
      let companyToSearch = aiPlan?.companyName || detIntent.companyName;

      // Si no especificó nombre de empresa pero usó pronombres o hay contexto activo
      let clientDoc = null;
      if (!companyToSearch && (aiPlan?.useCurrentContext || detIntent.useCurrentContext) && updatedContext?.clientId) {
        clientDoc = await getClientById(updatedContext.clientId);
      }

      // Si no tenemos documento aún, buscar la empresa en MongoDB
      if (!clientDoc && companyToSearch) {
        const searchResult = await searchClientsByName(companyToSearch);
        if (searchResult.exactMatch) {
          clientDoc = searchResult.exactMatch;
        } else if (searchResult.matches.length === 1) {
          clientDoc = await getClientById(searchResult.matches[0]._id);
        } else if (searchResult.matches.length > 1) {
          // Si hay varias coincidencias pero una de ellas es casi idéntica a lo buscado
          const cleanSearch = companyToSearch.toLowerCase().trim();
          const nearExact = searchResult.matches.find(m => m.nombreEmpresa.toLowerCase().trim().includes(cleanSearch) || cleanSearch.includes(m.nombreEmpresa.toLowerCase().trim()));
          if (nearExact && searchResult.matches.length <= 3) {
            clientDoc = await getClientById(nearExact._id);
          } else {
            updatedContext = {
              ...(updatedContext || {}),
              pendingMatches: searchResult.matches
            };
            returnedMatches = searchResult.matches;
            assistantText = formatMatchesDisambiguation(searchResult.matches);
          }
        }
      }

      // Si tenemos el documento del cliente, la IA redacta la respuesta usando toda la info
      if (clientDoc && !assistantText) {
        updatedContext = {
          clientId: clientDoc._id.toString(),
          clientName: clientDoc['Nombre de la Empresa'],
          pendingMatches: null
        };

        const aiDraft = await draftResponseWithAI({
          userMessage: cleanInput,
          retrievedData: clientDoc,
          queryType: 'CLIENT_DETAILS',
          currentClientName: clientDoc['Nombre de la Empresa']
        });

        if (aiDraft) {
          assistantText = aiDraft;
        }
      }

      // Si aún no hay respuesta y el usuario hizo una pregunta de filtro o búsqueda libre
      if (!assistantText) {
        // Intentar una búsqueda general permisiva con el texto del usuario
        const generalFilter = await queryClientsByFilter({ filterField: 'Nombre de la Empresa', filterValue: companyToSearch || cleanInput, limit: 10 });
        if (generalFilter.total > 0) {
          if (generalFilter.total === 1) {
            const singleDoc = await getClientById(generalFilter.results[0]._id);
            if (singleDoc) {
              updatedContext = {
                clientId: singleDoc._id.toString(),
                clientName: singleDoc['Nombre de la Empresa'],
                pendingMatches: null
              };
              assistantText = await draftResponseWithAI({
                userMessage: cleanInput,
                retrievedData: singleDoc,
                queryType: 'CLIENT_DETAILS',
                currentClientName: singleDoc['Nombre de la Empresa']
              });
            }
          } else {
            assistantText = await draftResponseWithAI({
              userMessage: cleanInput,
              retrievedData: generalFilter,
              queryType: 'FILTER_RESULTS',
              currentClientName: null
            });
          }
        }
      }
    }

    // E. Si después de todo no se pudo recuperar nada específico, dejar que la IA explique o responda conversacionalmente
    if (!assistantText) {
      assistantText = await draftResponseWithAI({
        userMessage: cleanInput,
        retrievedData: {
          mensaje: 'No se encontraron registros específicos en la base de datos para los criterios ingresados.',
          consulta: cleanInput,
          contextoPrevio: updatedContext?.clientName || null
        },
        queryType: 'UNKNOWN_OR_NOT_FOUND',
        currentClientName: updatedContext?.clientName || null
      });

      if (!assistantText) {
        assistantText = `No encontré registros en la base de datos que coincidan exactamente con tu consulta. Puedes indicarme el nombre de la empresa, el número telefónico, o el escuadrón que deseas consultar.`;
      }
    }
  }

  // 4. Persistir mensaje del usuario y respuesta del asistente
  await addMessageToConversation(conversation._id, {
    sender: 'user',
    text: cleanInput
  });

  const savedAssistantMsg = await addMessageToConversation(conversation._id, {
    sender: 'assistant',
    text: assistantText,
    returnedMatches
  });

  // Si es nueva conversación y tiene cliente en contexto, actualizar título amigable
  if (isNewConversation && updatedContext?.clientName) {
    await updateConversationTitle(conversation._id, `Consulta: ${updatedContext.clientName}`);
  }

  return {
    conversationId: conversation._id.toString(),
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
