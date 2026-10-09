import test from 'node:test';
import assert from 'node:assert/strict';
import { connectToDatabase, closeDatabaseConnection, getClientesCollection } from '../src/db/mongo.js';
import {
  searchClientsByName,
  getClientById,
  searchClientByPhone,
  verifyPhoneNumber,
  queryClientsByFilter
} from '../src/models/clientQuery.js';
import {
  createUser,
  findUserByUsername,
  updateUserPassword
} from '../src/models/userModel.js';
import {
  createConversation,
  getUserConversationById,
  listUserConversations,
  addMessageToConversation
} from '../src/models/conversationModel.js';
import { authenticateUser } from '../src/services/authService.js';
import { processChatMessage } from '../src/services/chatService.js';

test('1. Conexión con la base de datos existente', async () => {
  const db = await connectToDatabase();
  assert.ok(db, 'Debe conectarse a MongoDB');
  const cols = await db.listCollections().toArray();
  const names = cols.map(c => c.name);
  assert.ok(names.includes('clientes'), 'Debe existir la colección clientes');
  assert.ok(names.includes('clientes_telefonos_verificacion'), 'Debe existir clientes_telefonos_verificacion');
});

test('2. Búsqueda exacta por nombre de empresa', async () => {
  const res = await searchClientsByName("Academia de idiomas Let's Talk");
  assert.ok(res.exactMatch, 'Debe encontrar coincidencia exacta');
  assert.equal(res.exactMatch['Nombre de la Empresa'], "Academia de idiomas Let's Talk");
});

test('3. Búsqueda por número telefónico', async () => {
  const docs = await searchClientByPhone('0414-4006888');
  assert.ok(docs.length > 0, 'Debe encontrar al menos un cliente con el número');
  assert.equal(docs[0]['Nombre de la Empresa'], "Academia de idiomas Let's Talk");
});

test('4. Verificación del número en la colección auxiliar (y ambas colecciones)', async () => {
  // Número 0414-4247004 está en ambas (Zoraida Paris)
  const resBoth = await verifyPhoneNumber('0414-4247004');
  assert.equal(resBoth.status, 'COINCIDENCIA_AMBAS', 'Debe detectar coincidencia en ambas');
  assert.equal(resBoth.encontradoEnAuxiliar, true);
  assert.equal(resBoth.encontradoEnMaestro, true);

  // Número 0414-4006888 está solo en maestro
  const resMaestro = await verifyPhoneNumber('0414-4006888');
  assert.equal(resMaestro.status, 'ENCONTRADO_MAESTRO', 'Debe detectar solo maestro');
  assert.equal(resMaestro.encontradoEnMaestro, true);
});

test('5. Coincidencias aproximadas y selección entre varias empresas', async () => {
  // Búsqueda aproximada con minúsculas y sin acentos
  const res = await searchClientsByName('academia de idiomas');
  assert.ok(res.matches.length > 0, 'Debe devolver lista de coincidencias aproximadas');
  assert.ok(res.matches[0].nombreEmpresa.includes('Academia'), 'Debe incluir empresas con Academia');
});

test('6. Consulta de campos individuales y manejo de campos vacíos', async () => {
  const res = await searchClientsByName("Academia de idiomas Let's Talk");
  const client = res.exactMatch;
  assert.ok(client, 'Cliente debe existir');
  assert.equal(client['Contacto Principal'], 'Oriana');
  // Campo que sabemos que está vacío en este registro
  assert.equal(client['Correo electrónico'], '');
});

test('7. Manejo de clientes no encontrados', async () => {
  const res = await searchClientsByName('Empresa Inexistente ZZZ 999 123');
  assert.equal(res.exactMatch, null);
  assert.equal(res.matches.length, 0, 'No debe retornar coincidencias');
});

test('8. Inicio y cierre de sesión', async () => {
  const auth = await authenticateUser('admin', '123');
  assert.ok(auth.token, 'Debe retornar un token');
  assert.equal(auth.user.username, 'admin');

  await assert.rejects(
    async () => {
      await authenticateUser('admin', 'contraseña_incorrecta');
    },
    /Credenciales incorrectas/
  );
});

test('9. Separación de conversaciones entre usuarios', async () => {
  const userIdA = 'user_test_alpha_001';
  const userIdB = 'user_test_beta_002';

  const convA = await createConversation(userIdA, 'Conversación Privada A');
  const convB = await createConversation(userIdB, 'Conversación Privada B');

  // El usuario A solo puede leer la suya
  const readAByA = await getUserConversationById(convA._id, userIdA);
  assert.ok(readAByA, 'Usuario A puede leer su conversación');

  const readBByA = await getUserConversationById(convB._id, userIdA);
  assert.equal(readBByA, null, 'Usuario A NO debe poder acceder a la conversación de B');

  const listA = await listUserConversations(userIdA);
  const listB = await listUserConversations(userIdB);
  assert.ok(listA.every(c => c.id !== convB._id.toString()), 'Lista de A no debe incluir B');
  assert.ok(listB.every(c => c.id !== convA._id.toString()), 'Lista de B no debe incluir A');
});

test('10. Rechazo de intentos de modificar o eliminar clientes', async () => {
  const col = getClientesCollection();
  // Comprobamos que el modelo clientQuery no exporta ninguna función mutadora
  const clientQueryModule = await import('../src/models/clientQuery.js');
  const exportedFunctions = Object.keys(clientQueryModule);

  const forbiddenWords = ['insert', 'update', 'delete', 'remove', 'drop', 'replace'];
  for (const fn of exportedFunctions) {
    for (const forbidden of forbiddenWords) {
      assert.ok(!fn.toLowerCase().includes(forbidden), `No debe existir función mutadora ${fn}`);
    }
  }
});

test('11. Flujo conversacional y contexto de cliente', async () => {
  const userId = 'user_chat_flow_test';
  // 1. Mensaje buscando empresa
  const step1 = await processChatMessage({
    userId,
    messageText: "Qué información tenemos de Academia de idiomas Let's Talk"
  });
  assert.ok(step1.assistantMessage.text.includes('Academia de idiomas Let\'s Talk'));
  assert.ok(step1.currentContext.clientId, 'Debe guardar el cliente en contexto');

  // 2. Pregunta contextual ("¿Cuál es el teléfono de esa empresa?")
  const step2 = await processChatMessage({
    userId,
    conversationId: step1.conversationId,
    messageText: 'Cuál es el teléfono de esa empresa?'
  });
  assert.ok(step2.assistantMessage.text.includes('0414-4006888'), 'Debe responder con el teléfono del cliente en contexto');
});

test.after(async () => {
  await closeDatabaseConnection();
});
