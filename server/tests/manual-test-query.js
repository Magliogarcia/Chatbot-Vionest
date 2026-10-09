import { connectToDatabase, closeDatabaseConnection } from '../src/db/mongo.js';
import { searchClientsByName, verifyPhoneNumber, queryClientsByFilter } from '../src/models/clientQuery.js';

async function test() {
  await connectToDatabase();
  console.log('--- Probando búsqueda exacta ---');
  const resExact = await searchClientsByName("Academia de idiomas Let's Talk");
  console.log('Resultado exacto encontrado:', !!resExact.exactMatch, resExact.matches[0]?.nombreEmpresa);

  console.log('\n--- Probando búsqueda aproximada ("lets talk") ---');
  const resApprox = await searchClientsByName('lets talk');
  console.log('Coincidencias aproximadas:', resApprox.matches.length, resApprox.matches[0]?.nombreEmpresa);

  console.log('\n--- Probando verificación de teléfono maestro (0414-4006888) ---');
  const verif1 = await verifyPhoneNumber('0414-4006888');
  console.log('Resultado 1:', verif1.status, 'Encontrado Aux:', verif1.encontradoEnAuxiliar, 'Encontrado Maestro:', verif1.encontradoEnMaestro);

  console.log('\n--- Probando verificación de teléfono auxiliar (0414-4247004) ---');
  const verif2 = await verifyPhoneNumber('0414-4247004');
  console.log('Resultado 2:', verif2.status, 'Encontrado Aux:', verif2.encontradoEnAuxiliar, 'Encontrado Maestro:', verif2.encontradoEnMaestro);

  console.log('\n--- Probando filtro por Escuadrón 2 ---');
  const filterRes = await queryClientsByFilter({ filterField: 'Escuadrón Asignado', filterValue: 'Escuadrón 2' });
  console.log('Filtro total:', filterRes.total, 'Retornados:', filterRes.returned);

  await closeDatabaseConnection();
}

test();
