import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const defaultModels = [
  'liquid/lfm-3-1.7b:free',
  'dots-studio/dots-3-note-preview:free'
];

const parsedModels = process.env.OPENROUTER_MODELS
  ? process.env.OPENROUTER_MODELS.split(',').map((m) => m.trim()).filter(Boolean)
  : defaultModels;

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017',
    dbName: process.env.MONGODB_DB_NAME || 'vionest'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_secret_for_local_dev_only_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  admin: {
    initialUsername: process.env.ADMIN_INITIAL_USERNAME || 'admin',
    initialPassword: process.env.ADMIN_INITIAL_PASSWORD || '123'
  },
  deepseek: {
    apiKey: (process.env.DEEPSEEK_API_KEY || '').trim(),
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    timeoutMs: parseInt(process.env.DEEPSEEK_TIMEOUT_MS || '40000', 10)
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY ? process.env.OPENROUTER_API_KEY.trim() : '',
    models: parsedModels.length > 0 ? parsedModels : defaultModels,
    timeoutMs: parseInt(process.env.OPENROUTER_TIMEOUT_MS || '10000', 10),
    maxTotalTimeoutMs: 65000
  },
  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || '').trim(),
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS || '10000', 10)
  }
};
