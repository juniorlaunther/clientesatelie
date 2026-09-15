import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-81be4f42-de43-48c5-9c71-1bd0049bba5a");

async function testRecalcular() {
  const { orderBy, writeBatch, doc } = await import('firebase/firestore');
  const clientesSnap = await getDocs(query(collection(db, 'clientes'), orderBy('dataPrimeiraCompra', 'asc')));
  let clientes = clientesSnap.docs.map(d => ({ ...d.data(), email: d.id }));
  console.log("Found", clientes.length, "clients");
  
  clientes.sort((a, b) => {
      if (a.dataPrimeiraCompra !== b.dataPrimeiraCompra) {
        return a.dataPrimeiraCompra - b.dataPrimeiraCompra;
      }
      if (a.codigoPrimeiraCompra && b.codigoPrimeiraCompra) {
        return a.codigoPrimeiraCompra.localeCompare(b.codigoPrimeiraCompra);
      }
      return 0;
  });
  
  let batch = writeBatch(db);
  let opCount = 0;
  let expectedNumber = 1;
  for (const c of clientes) {
      if (c.numero !== expectedNumber) {
        batch.update(doc(db, 'clientes', c.email), { numero: expectedNumber });
        opCount++;
      }
      expectedNumber++;
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
  }
  if (opCount > 0) {
      await batch.commit();
  }
  console.log("Recalculated with ops:", opCount);
}
testRecalcular().then(()=>process.exit(0)).catch(e=>{console.error(e); process.exit(1)});
