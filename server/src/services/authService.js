import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { findUserByUsername } from '../models/userModel.js';

export function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

export async function authenticateUser(username, password) {
  if (!username || !password) {
    throw new Error('Debe ingresar usuario y contraseña.');
  }

  const user = await findUserByUsername(username);
  if (!user) {
    throw new Error('Credenciales incorrectas.');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Credenciales incorrectas.');
  }

  const tokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role
  };

  const token = generateToken(tokenPayload);

  return {
    token,
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword
    }
  };
}
