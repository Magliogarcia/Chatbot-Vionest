import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getUsersCollection } from '../db/mongo.js';

export async function findUserByUsername(username) {
  if (!username) return null;
  const col = getUsersCollection();
  return await col.findOne({ username: username.toLowerCase().trim() });
}

export async function findUserById(id) {
  if (!id) return null;
  const col = getUsersCollection();
  try {
    return await col.findOne({ _id: new ObjectId(id) });
  } catch {
    return null;
  }
}

export async function createUser({ username, password, role = 'employee' }) {
  const col = getUsersCollection();
  const cleanUsername = username.toLowerCase().trim();

  const existing = await col.findOne({ username: cleanUsername });
  if (existing) {
    throw new Error('El nombre de usuario ya está registrado.');
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = {
    username: cleanUsername,
    passwordHash,
    role: role === 'admin' ? 'admin' : 'employee',
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await col.insertOne(newUser);
  return {
    _id: result.insertedId.toString(),
    username: newUser.username,
    role: newUser.role,
    mustChangePassword: newUser.mustChangePassword
  };
}

export async function updateUserPassword(userId, newPassword) {
  const col = getUsersCollection();
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);

  await col.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        passwordHash,
        mustChangePassword: false,
        updatedAt: new Date()
      }
    }
  );
  return true;
}

export async function listAllUsers() {
  const col = getUsersCollection();
  const users = await col.find({}, { projection: { passwordHash: 0 } }).toArray();
  return users.map(u => ({
    _id: u._id.toString(),
    username: u.username,
    role: u.role,
    mustChangePassword: u.mustChangePassword,
    createdAt: u.createdAt
  }));
}
