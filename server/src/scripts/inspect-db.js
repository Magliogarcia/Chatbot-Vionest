import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGODB_DB_NAME || 'vionest';

async function inspect() {
  console.log(`Conectando a MongoDB en ${uri}...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Conexión exitosa a MongoDB');

    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`\nColecciones en la base de datos "${dbName}":`);
    for (const col of collections) {
      console.log(` - ${col.name}`);
    }

    // Inspect clientes
    console.log('\n--- Inspección de colección "clientes" ---');
    const clientesCol = db.collection('clientes');
    const totalClientes = await clientesCol.countDocuments();
    console.log(`Total documentos en clientes: ${totalClientes}`);

    const clientesIndexes = await clientesCol.indexes();
    console.log('Índices en clientes:', JSON.stringify(clientesIndexes, null, 2));

    const sampleClientes = await clientesCol.find({}).limit(3).toArray();
    console.log('Muestra de 3 documentos de clientes:');
    console.log(JSON.stringify(sampleClientes, null, 2));

    // Get all unique field keys across sample
    const allSampleClientes = await clientesCol.find({}).limit(50).toArray();
    const fieldsSet = new Set();
    for (const doc of allSampleClientes) {
      Object.keys(doc).forEach(k => fieldsSet.add(k));
    }
    console.log('\nCampos encontrados en clientes (muestra de 50 docs):');
    console.log(Array.from(fieldsSet).sort());

    // Inspect clientes_telefonos_verificacion
    console.log('\n--- Inspección de colección "clientes_telefonos_verificacion" ---');
    const telCol = db.collection('clientes_telefonos_verificacion');
    const totalTel = await telCol.countDocuments();
    console.log(`Total documentos en clientes_telefonos_verificacion: ${totalTel}`);

    const telIndexes = await telCol.indexes();
    console.log('Índices en clientes_telefonos_verificacion:', JSON.stringify(telIndexes, null, 2));

    const sampleTel = await telCol.find({}).limit(5).toArray();
    console.log('Muestra de 5 documentos de clientes_telefonos_verificacion:');
    console.log(JSON.stringify(sampleTel, null, 2));

    // Unique values of 'En maestro'
    const distinctEnMaestro = await telCol.distinct('En maestro');
    console.log('Valores distintos de "En maestro":', distinctEnMaestro);

  } catch (err) {
    console.error('❌ Error inspeccionando MongoDB:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nConexión cerrada.');
  }
}

inspect();
