import { verifyToken } from '../services/authService.js';
import { findUserById } from '../models/userModel.js';

export async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado. Se requiere iniciar sesión.'
      });
    }

    const decoded = verifyToken(token);
    const user = await findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Sesión inválida o usuario no encontrado.'
      });
    }

    req.user = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword
    };

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Sesión expirada o token inválido.'
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}
