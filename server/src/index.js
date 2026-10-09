import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/index.js';
import { connectToDatabase } from './db/mongo.js';
import { seedAdminUser } from './scripts/seed-admin.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

// Configuración de Seguridad y CORS
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones locales, Vercel o sin origin (server-to-server)
    if (!origin) return callback(null, true);
    const allowed = [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
    if (allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/system', systemRoutes);

// Ruta informativa base de la API
app.get('/api', (req, res) => {
  res.json({
    name: 'Vionest Chatbot API',
    version: '1.0.0',
    description: 'Servicio de consulta de clientes Vionest'
  });
});

// Servir frontend compilado si existe
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Middleware centralizado de errores
app.use(errorHandler);

// Iniciar servidor local
async function startServer() {
  try {
    await connectToDatabase();
    await seedAdminUser();

    // Enlazar a localhost para garantizar operación exclusivamente local
    const server = app.listen(config.port, '127.0.0.1', () => {
      console.log(`🚀 Servidor backend de Vionest ejecutándose en: http://127.0.0.1:${config.port}`);
    });

    const shutdown = async () => {
      console.log('\nApagando servidor de forma segura...');
      server.close(async () => {
        const { closeDatabaseConnection } = await import('./db/mongo.js');
        await closeDatabaseConnection();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return server;
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

// Iniciar si se ejecuta directamente
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  startServer();
}

export { app, startServer };
