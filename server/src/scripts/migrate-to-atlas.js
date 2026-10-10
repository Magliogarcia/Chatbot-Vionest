import { MongoClient } from 'mongodb';

const LOCAL_URI = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017';
const ATLAS_URI = process.argv[2] || process.env.ATLAS_MONGODB_URI || process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'vionest';

if (!ATLAS_URI || ATLAS_URI.includes('127.0.0.1') || ATLAS_URI.includes('localhost')) {
  console.error('\n❌ Debes proporcionar tu URI de MongoDB Atlas como argumento.');
  console.error('Uso: node server/src/scripts/migrate-to-atlas.js "mongodb+srv://usuario:password@cluster0.xxx.mongodb.net/vionest?retryWrites=true&w=majority"\n');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Iniciando migración de datos a MongoDB Atlas...');
  console.log(`📡 Conectando a Base de Datos Local: ${LOCAL_URI}`);
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  const localDb = localClient.db(DB_NAME);
  console.log('✅ Conectado a MongoDB Local.');

  console.log(`☁️ Conectando a MongoDB Atlas en la nube...`);
  const atlasClient = new MongoClient(ATLAS_URI);
  await atlasClient.connect();
  const atlasDb = atlasClient.db(DB_NAME);
  console.log('✅ Conectado a MongoDB Atlas.');

  try {
    // 1. Migrar colección "clientes"
    console.log('\n--- Migrando colección "clientes" ---');
    const localClientesCol = localDb.collection('clientes');
    const atlasClientesCol = atlasDb.collection('clientes');

    const clientes = await localClientesCol.find({}).toArray();
    console.log(`📦 Encontrados ${clientes.length} documentos locales en "clientes".`);

    if (clientes.length > 0) {
      // Limpiar colección previa en Atlas si existía
      await atlasClientesCol.deleteMany({});
      
      // Insertar por lotes de 500
      const batchSize = 500;
      for (let i = 0; i < clientes.length; i += batchSize) {
        const batch = clientes.slice(i, i + batchSize);
        await atlasClientesCol.insertMany(batch);
        console.log(`  -> Insertados ${Math.min(i + batchSize, clientes.length)} / ${clientes.length} clientes...`);
      }

      // Recrear índices esenciales
      console.log('  -> Creando índices para búsqueda rápida en "clientes"...');
      await atlasClientesCol.createIndex({ 'Nombre de la Empresa': 1 }, { name: 'idx_nombre_empresa' });
      await atlasClientesCol.createIndex({ 'Número telefónico': 1 }, { name: 'idx_numero_telefonico' });
      console.log('  ✅ Colección "clientes" migrada exitosamente.');
    }

    // 2. Migrar colección "clientes_telefonos_verificacion"
    console.log('\n--- Migrando colección "clientes_telefonos_verificacion" ---');
    const localTelCol = localDb.collection('clientes_telefonos_verificacion');
    const atlasTelCol = atlasDb.collection('clientes_telefonos_verificacion');

    const telefonos = await localTelCol.find({}).toArray();
    console.log(`📦 Encontrados ${telefonos.length} documentos locales en "clientes_telefonos_verificacion".`);

    if (telefonos.length > 0) {
      await atlasTelCol.deleteMany({});

      const batchSize = 500;
      for (let i = 0; i < telefonos.length; i += batchSize) {
        const batch = telefonos.slice(i, i + batchSize);
        await atlasTelCol.insertMany(batch);
        console.log(`  -> Insertados ${Math.min(i + batchSize, telefonos.length)} / ${telefonos.length} teléfonos...`);
      }

      console.log('  -> Creando índices en "clientes_telefonos_verificacion"...');
      await atlasTelCol.createIndex({ 'Nombre / Empresa': 1 }, { name: 'idx_nombre_empresa_verificacion' });
      await atlasTelCol.createIndex({ 'numero': 1 }, { name: 'idx_numero_verificacion' });
      console.log('  ✅ Colección "clientes_telefonos_verificacion" migrada exitosamente.');
    }

    // Comprobación final
    const finalClientesCount = await atlasClientesCol.countDocuments();
    const finalTelCount = await atlasTelCol.countDocuments();
    console.log('\n🎉 ¡MIGRACIÓN COMPLETADA CON ÉXITO!');
    console.log(`📊 Total clientes en Atlas: ${finalClientesCount}`);
    console.log(`📊 Total teléfonos en Atlas: ${finalTelCount}`);
    console.log('Ahora tu Chatbot en la nube podrá consultar a "Affari shop" y a todos los clientes.');

  } catch (err) {
    console.error('❌ Error durante la migración:', err);
  } finally {
    await localClient.close();
    await atlasClient.close();
    console.log('\nConexiones cerradas.');
  }
}

migrate();
