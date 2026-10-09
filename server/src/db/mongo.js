import { MongoClient } from 'mongodb';
import { config } from '../config/index.js';

let client = null;
let db = null;

export async function connectToDatabase() {
  if (db) return db;

  try {
    client = new MongoClient(config.mongo.uri);
    await client.connect();
    db = client.db(config.mongo.dbName);
    console.log(`[MongoDB] Conectado exitosamente a la base de datos: "${config.mongo.dbName}"`);

    // Asegurar índices necesarios para usuarios y conversaciones (sin alterar clientes)
    const usersCol = db.collection('users');
    await usersCol.createIndex({ username: 1 }, { unique: true });

    const convCol = db.collection('chat_conversations');
    await convCol.createIndex({ userId: 1, updatedAt: -1 });

    return db;
  } catch (error) {
    console.error('[MongoDB] Error al conectar a la base de datos:', error.message);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a connectToDatabase() primero.');
  }
  return db;
}

export function getClientesCollection() {
  return getDb().collection('clientes');
}

export function getVerificacionCollection() {
  return getDb().collection('clientes_telefonos_verificacion');
}

export function getUsersCollection() {
  return getDb().collection('users');
}

export function getConversationsCollection() {
  return getDb().collection('chat_conversations');
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[MongoDB] Conexión cerrada.');
  }
}
