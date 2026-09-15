import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-81be4f42-de43-48c5-9c71-1bd0049bba5a");

async function run() {
  const q = query(collection(db, 'clientes'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("No clients found");
    process.exit(0);
  }
  const email = snap.docs[0].id;
  console.log("Attempting to delete client:", email);
  
  // We can just emulate what bulkDeleteClientes does
  try {
     const { writeBatch, doc, where } = await import('firebase/firestore');
     let batch = writeBatch(db);
     batch.delete(doc(db, 'clientes', email));
     const qCompras = query(collection(db, 'compras'), where('clienteId', '==', email));
     const snapCompras = await getDocs(qCompras);
     for (const d of snapCompras.docs) batch.delete(d.ref);

     const qProd = query(collection(db, 'produtos_comprados'), where('clienteId', '==', email));
     const snapProd = await getDocs(qProd);
     for (const d of snapProd.docs) batch.delete(d.ref);
     
     await batch.commit();
     console.log("Batch committed successfully for client:", email);
  } catch (err) {
     console.error("Error during deletion:", err);
  }
  process.exit(0);
}

run();
