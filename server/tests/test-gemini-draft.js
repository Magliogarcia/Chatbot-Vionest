import { draftResponseWithGemini } from '../src/services/geminiService.js';
import { connectToDatabase, closeDatabaseConnection } from '../src/db/mongo.js';
import { searchClientsByName, getClientById } from '../src/models/clientQuery.js';

async function test() {
  await connectToDatabase();
  const search = await searchClientsByName("Let's Talk");
  let doc = search.exactMatch;
  if (!doc && search.matches.length > 0) {
    doc = await getClientById(search.matches[0]._id);
  }
  console.log('Doc found:', doc?.['Nombre de la Empresa']);

  const draft = await draftResponseWithGemini({
    userMessage: "Cuéntame qué sabemos de la empresa Let's Talk",
    retrievedData: doc,
    queryType: 'CLIENT_DETAILS',
    currentClientName: doc?.['Nombre de la Empresa']
  });

  console.log('--- DRAFT RESULT ---');
  console.log(draft);
  await closeDatabaseConnection();
}

test();
