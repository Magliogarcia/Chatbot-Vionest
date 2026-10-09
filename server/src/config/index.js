import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  }
};
