import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/index.js';
import { connectToDatabase, closeDatabaseConnection } from '../src/db/mongo.js';
import { seedAdminUser } from '../src/scripts/seed-admin.js';

let serverInstance;
let baseUrl;

test.before(async () => {
  await connectToDatabase();
  await seedAdminUser();
  await new Promise((resolve) => {
    serverInstance = app.listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
  }
  await closeDatabaseConnection();
});

test('API 1: /api/system/status retorna estado de BD sin exponer credenciales', async () => {
  const res = await fetch(`${baseUrl}/api/system/status`);
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.equal(data.database.connected, true);
  assert.ok(data.database.clientesCount > 0);
  // Verificar explícitamente que no se expone la API key
  assert.equal(data.gemini.apiKey, undefined, 'No debe filtrar GEMINI_API_KEY');
});

test('API 2: Ruta protegida rechaza petición no autenticada con 401', async () => {
  const res = await fetch(`${baseUrl}/api/chat/conversations`);
  const data = await res.json();

  assert.equal(res.status, 401);
  assert.equal(data.success, false);
  assert.match(data.error, /No autorizado/);
});

test('API 3: Inicio de sesión exitoso con cookie y token', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: '123' })
  });
  const data = await res.json();

  assert.equal(res.status, 200);
  assert.equal(data.success, true);
  assert.ok(data.token, 'Debe devolver un JWT token');
  assert.equal(data.user.username, 'admin');

  // Enviar mensaje autenticado
  const chatRes = await fetch(`${baseUrl}/api/chat/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`
    },
    body: JSON.stringify({
      messageText: "¿Qué información tenemos de Academia de idiomas Let's Talk?"
    })
  });
  const chatData = await chatRes.json();

  assert.equal(chatRes.status, 200);
  assert.equal(chatData.success, true);
  assert.ok(chatData.conversationId);
  assert.ok(chatData.assistantMessage.text.includes('Academia de idiomas Let\'s Talk'));
});

test('API 4: Rechazo de intentos de login con credenciales erróneas', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password_invalido' })
  });
  const data = await res.json();

  assert.equal(res.status, 401);
  assert.equal(data.success, false);
  assert.match(data.error, /Credenciales incorrectas/);
});
