import bcrypt from 'bcryptjs';
import { connectToDatabase, closeDatabaseConnection, getUsersCollection } from '../db/mongo.js';
import { config } from '../config/index.js';

export async function seedAdminUser() {
  const usersCol = getUsersCollection();
  const username = config.admin.initialUsername.toLowerCase().trim();
  const password = config.admin.initialPassword;

  const existing = await usersCol.findOne({ username });
  if (existing) {
    console.log(`[Seed] El usuario "${username}" ya existe en la base de datos.`);
    return existing;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = {
    username,
    passwordHash,
    role: 'admin',
    mustChangePassword: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await usersCol.insertOne(newUser);
  console.log(`[Seed] Usuario inicial "${username}" creado exitosamente (ID: ${result.insertedId}).`);
  return { ...newUser, _id: result.insertedId };
}

// Permitir ejecución directa del script
if (process.argv[1] && process.argv[1].endsWith('seed-admin.js')) {
  (async () => {
    try {
      await connectToDatabase();
      await seedAdminUser();
    } catch (err) {
      console.error('[Seed] Error ejecutando seed:', err);
      process.exit(1);
    } finally {
      await closeDatabaseConnection();
    }
  })();
}
