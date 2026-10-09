import express from 'express';
import { getDb } from '../db/mongo.js';
import { config } from '../config/index.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  let dbConnected = false;
  let clientCount = 0;
  let verifCount = 0;

  try {
    const db = getDb();
    const [cCount, vCount] = await Promise.all([
      db.collection('clientes').countDocuments(),
      db.collection('clientes_telefonos_verificacion').countDocuments()
    ]);
    dbConnected = true;
    clientCount = cCount;
    verifCount = vCount;
  } catch (err) {
    dbConnected = false;
  }

  res.json({
    success: true,
    status: 'online',
    database: {
      connected: dbConnected,
      name: config.mongo.dbName,
      clientesCount: clientCount,
      verificacionCount: verifCount
    },
    gemini: {
      configured: Boolean(config.gemini.apiKey),
      model: config.gemini.model
      // ¡JAMÁS exponer la API key aquí!
    },
    serverTime: new Date().toISOString()
  });
});

export default router;
