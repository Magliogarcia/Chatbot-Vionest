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

  // 2. Comprobar si el usuario está seleccionando de una lista previa de desambiguación (Sección 9)
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

        if (!aiResponse) {
          throw new Error('Los agentes de IA no pudieron responder en este momento. Por favor reintenta tu consulta.');
        }

        assistantText = aiResponse;
      }
    }
  }

  // 3. Si no fue una selección de desambiguación, procesar la consulta con IA
  if (!assistantText) {
    // Parser determinista para pre-filtrar intención
    const detIntent = parseDeterministicQuery(cleanInput, updatedContext);

    // Consulta de intención a la IA de OpenRouter si hay incertidumbre
    let aiIntent = null;
    if ((config.openRouter.apiKey || config.gemini.apiKey) && (detIntent.intent === 'UNKNOWN' || detIntent.intent === 'CLIENT_SEARCH')) {
      aiIntent = await parseQueryWithAI(cleanInput, updatedContext);
    }

    const intent = aiIntent?.intent || detIntent.intent;

    // Procesar según la intención identificada
    switch (intent) {
      case 'HELP_OR_GREETING': {
        const aiDraft = await draftResponseWithAI({
          userMessage: cleanInput,
          retrievedData: {
            sistema: 'Vionest Chatbot Interno de Clientes',
            alcance: 'Consulta conversacional concisa de datos verificados de clientes en MongoDB.'
          },
          queryType: 'GREETING',
          currentClientName: updatedContext?.clientName || null
        });

        if (!aiDraft) {
          throw new Error('Los agentes de IA no pudieron responder en este momento. Por favor reintenta tu consulta.');
        }

        assistantText = aiDraft;
        break;
      }

      case 'VERIFY_PHONE': {
        let phoneToVerify = aiIntent?.phoneNumber || detIntent.phoneNumber;

        // Si se refirió a la empresa en contexto y no dio un teléfono explícito
        if (!phoneToVerify && updatedContext?.clientId) {
          const clientDoc = await getClientById(updatedContext.clientId);
          if (clientDoc && clientDoc['Número telefónico']) {
            phoneToVerify = clientDoc['Número telefónico'];
          }
        }

        if (!phoneToVerify) {
          assistantText = 'Por favor proporciona el número telefónico que deseas verificar, o selecciona primero una empresa en la conversación.';
        } else {
          const verifResult = await verifyPhoneNumber(phoneToVerify);
          const aiDraft = await draftResponseWithAI({
            userMessage: cleanInput,
            retrievedData: { telefonoConsultado: phoneToVerify, ...verifResult },
            queryType: 'PHONE_VERIFICATION',
            currentClientName: updatedContext?.clientName || null
          });

          if (!aiDraft) {
            throw new Error('Los agentes de IA no pudieron redactar la verificación del teléfono a tiempo.');
          }

          assistantText = aiDraft;
        }
        break;
      }

      case 'SEARCH_BY_PHONE': {
        const phone = aiIntent?.phoneNumber || detIntent.phoneNumber;
        if (!phone) {
          assistantText = 'Por favor ingresa el número telefónico que deseas buscar.';
        } else {
          const docs = await searchClientByPhone(phone);
          if (docs.length === 0) {
            assistantText = `No se encontró ningún cliente registrado con el número **${phone}** en la base de datos de Vionest.`;
          } else if (docs.length === 1) {
            const clientDoc = docs[0];
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

            if (!aiDraft) {
              throw new Error('Los agentes de IA no pudieron redactar los datos del cliente a tiempo.');
            }

            assistantText = aiDraft;
          } else {
            // Múltiples clientes con el mismo teléfono: presentar tarjetas de selección
            const matches = docs.map(d => ({
              _id: d._id.toString(),
              nombreEmpresa: d['Nombre de la Empresa'],
              telefono: d['Número telefónico'],
              ubicacion: d['Ubicación exacta'] || ''
            }));
            updatedContext = {
              ...(updatedContext || {}),
              pendingMatches: matches
            };
            returnedMatches = matches;
            assistantText = formatMatchesDisambiguation(matches);
          }
        }
        break;
      }

      case 'FILTER_QUERY': {
        const filterField = aiIntent?.filterField || detIntent.filterField;
        const filterValue = aiIntent?.filterValue || detIntent.filterValue;

        if (!filterField || !filterValue) {
          assistantText = 'No pude identificar el criterio de filtro. Puedes consultar por Escuadrón (ej: *Escuadrón 2*) o por Estatus (ej: *No interesado*).';
        } else {
          try {
            const filterRes = await queryClientsByFilter({ filterField, filterValue, limit: 15 });
            if (filterRes.total === 0) {
              assistantText = `No se encontraron clientes registrados con el criterio **${filterField} = "${filterValue}"**.`;
            } else {
              const aiDraft = await draftResponseWithAI({
                userMessage: cleanInput,
                retrievedData: filterRes,
                queryType: 'FILTER_RESULTS',
                currentClientName: null
              });

              if (!aiDraft) {
                throw new Error('Los agentes de IA no pudieron sintetizar los resultados del filtro a tiempo.');
              }

              assistantText = aiDraft;
            }
          } catch (filterErr) {
            assistantText = `No fue posible realizar la consulta filtrada: ${filterErr.message}`;
          }
        }
        break;
      }

      case 'CLIENT_FIELD_QUERY': {
        const wantsContext = aiIntent?.useCurrentContext || detIntent.useCurrentContext;
        const targetCompany = aiIntent?.companyName;

        let clientDoc = null;
        if (targetCompany) {
          const searchRes = await searchClientsByName(targetCompany);
          if (searchRes.exactMatch) {
            clientDoc = searchRes.exactMatch;
          } else if (searchRes.matches.length === 1) {
            clientDoc = await getClientById(searchRes.matches[0]._id);
          }
        } else if (wantsContext && updatedContext?.clientId) {
          clientDoc = await getClientById(updatedContext.clientId);
        }

        if (!clientDoc) {
          assistantText = updatedContext?.clientName
            ? `¿Deseas consultar sobre **${updatedContext.clientName}** o sobre otra empresa? Por favor indícame el nombre.`
            : '¿A qué empresa te refieres? Por favor indícame el nombre de la empresa para consultar sus datos.';
        } else {
          updatedContext = {
            clientId: clientDoc._id.toString(),
            clientName: clientDoc['Nombre de la Empresa'],
            pendingMatches: null
          };

          const aiDraft = await draftResponseWithAI({
            userMessage: cleanInput,
            retrievedData: clientDoc,
            queryType: 'FIELD_QUERY',
            currentClientName: clientDoc['Nombre de la Empresa']
          });

          if (!aiDraft) {
            throw new Error('Los agentes de IA no pudieron responder en este momento sobre este campo.');
          }

          assistantText = aiDraft;
        }
        break;
      }

      case 'CLIENT_SEARCH':
      default: {
        const companyToSearch = aiIntent?.companyName || detIntent.companyName || cleanInput;
        const searchResult = await searchClientsByName(companyToSearch);

        if (searchResult.exactMatch) {
          const clientDoc = searchResult.exactMatch;
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

          if (!aiDraft) {
            throw new Error('Los agentes de IA no pudieron redactar los datos del cliente a tiempo.');
          }

          assistantText = aiDraft;
        } else if (searchResult.matches.length === 1) {
          const clientDoc = await getClientById(searchResult.matches[0]._id);
          if (clientDoc) {
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

            if (!aiDraft) {
              throw new Error('Los agentes de IA no pudieron redactar los datos del cliente a tiempo.');
            }

            assistantText = aiDraft;
          } else {
            assistantText = `No se encontró información detallada para "${companyToSearch}".`;
          }
        } else if (searchResult.matches.length > 1) {
          // Coincidencias múltiples: DEBE requerir selección interactiva
          updatedContext = {
            ...(updatedContext || {}),
            pendingMatches: searchResult.matches
          };
          returnedMatches = searchResult.matches;
          assistantText = formatMatchesDisambiguation(searchResult.matches);
        } else {
          assistantText = `No se encontró ninguna empresa que coincida con **"${companyToSearch}"** en la base de datos de Vionest. Por favor verifica la ortografía o intenta con otro término.`;
        }
        break;
      }
    }
  }

  // 4. Guardar mensajes en la conversación persistente
  const userMsgObj = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sender: 'user',
    text: cleanInput,
    timestamp: new Date()
  };

  const assistantMsgObj = {
    id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sender: 'assistant',
    text: assistantText,
    matches: returnedMatches,
    timestamp: new Date()
  };

  await addMessageToConversation(conversation.id || conversation._id, userId, userMsgObj);
  await addMessageToConversation(conversation.id || conversation._id, userId, assistantMsgObj, updatedContext);

  // Si fue nueva conversación y el título era el mensaje crudo largo, recortar a algo amigable
  if (isNewConversation && updatedContext?.clientName) {
    await updateConversationTitle(conversation.id || conversation._id, userId, `Consulta: ${updatedContext.clientName}`);
  }

  return {
    conversationId: (conversation.id || conversation._id).toString(),
    userMessage: userMsgObj,
    assistantMessage: assistantMsgObj,
    currentContext: updatedContext
  };
}
