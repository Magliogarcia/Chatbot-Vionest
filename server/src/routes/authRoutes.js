import express from 'express';
import { z } from 'zod';
import { authenticateUser } from '../services/authService.js';
import { createUser, updateUserPassword, listAllUsers, findUserById } from '../models/userModel.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Esquema de validación para Login
const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido').max(50),
  password: z.string().min(1, 'La contraseña es requerida').max(100)
});

// Esquema de validación para Crear Usuario
const createUserSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(30),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(100),
  role: z.enum(['admin', 'employee']).default('employee')
});

// Esquema de validación para Cambio de Contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres').max(100)
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const { username, password } = parseResult.data;
    const { token, user } = await authenticateUser(username, password);

    // Configurar cookie HttpOnly segura
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    return res.json({
      success: true,
      user,
      token // También se envía para clientes que utilicen Authorization header
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: err.message || 'Error al iniciar sesión'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax'
  });
  return res.json({
    success: true,
    message: 'Sesión cerrada correctamente'
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  return res.json({
    success: true,
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword
    }
  });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const parseResult = changePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const { currentPassword, newPassword } = parseResult.data;
    const user = await findUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isMatch = await import('bcryptjs').then(b => b.default.compare(currentPassword, user.passwordHash));
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'La contraseña actual no es correcta.' });
    }

    await updateUserPassword(req.user.userId, newPassword);

    return res.json({
      success: true,
      message: 'Contraseña actualizada correctamente.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/create-user (Solo Administrador)
router.post('/create-user', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: parseResult.error.errors[0].message
      });
    }

    const { username, password, role } = parseResult.data;
    const created = await createUser({ username, password, role });

    return res.status(201).json({
      success: true,
      message: `Usuario ${created.username} creado correctamente.`,
      user: created
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message || 'Error al crear usuario'
    });
  }
});

// GET /api/auth/users (Solo Administrador)
router.get('/users', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await listAllUsers();
    return res.json({
      success: true,
      users
    });
  } catch (err) {
    next(err);
  }
});

export default router;
