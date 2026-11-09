import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ATLAS_URI = 'mongodb+srv://maglio_admin:maglio28g@cluster0.8nhpulc.mongodb.net/?appName=Cluster0';
const DB_NAME = 'vionest';
const OUTPUT_DIR = path.resolve(__dirname, '../../data/backup_atlas');

async function exportAtlasData() {
  console.log(`[Backup Atlas] Iniciando conexión con MongoDB Atlas...`);
  const client = new MongoClient(ATLAS_URI);

  try {
    await client.connect();
    console.log(`[Backup Atlas] ✅ Conectado exitosamente.`);

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`[Backup Atlas] Carpeta de destino: ${OUTPUT_DIR}\n`);

    const summary = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`[Backup Atlas] ⏳ Extrayendo colección: "${colName}"...`);

      const collection = db.collection(colName);
      const docs = await collection.find({}).toArray();

      const filePath = path.join(OUTPUT_DIR, `${colName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');

      console.log(`[Backup Atlas] ✅ Guardado "${colName}.json" (${docs.length} documentos)`);
      summary.push({ coleccion: colName, total: docs.length, archivo: `${colName}.json` });
    }

    // Guardar resumen del backup con timestamp
    const manifest = {
      database: DB_NAME,
      fechaExportacion: new Date().toISOString(),
      resumen: summary
    };
    fs.writeFileSync(path.join(OUTPUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    console.log('\n========================================');
    console.log('🎉 COPIA DE SEGURIDAD COMPLETADA CON ÉXITO');
    console.log('========================================');
    console.table(summary);
    console.log(`Ruta local: ${OUTPUT_DIR}\n`);

  } catch (err) {
    console.error(`[Backup Atlas] ❌ Error durante la exportación:`, err.message);
  } finally {
    await client.close();
  }
}

exportAtlasData();

