import rateLimit from 'express-rate-limit';

// Limitador estricto para intentos de login (prevenir fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos por IP
  message: {
    success: false,
    error: 'Demasiados intentos de inicio de sesión. Por favor espere 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limitador para consultas al chatbot
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // Máximo 30 mensajes por minuto
  message: {
    success: false,
    error: 'Has alcanzado el límite de consultas por minuto. Por favor, espera un momento.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
