import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, deleteDoc, writeBatch } from "firebase/firestore";
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function clean() {
  const clientsSnap = await getDocs(collection(db, 'clientes'));
  const clientIds = new Set();
  clientsSnap.forEach(d => clientIds.add(d.id));

  const comprasSnap = await getDocs(collection(db, 'compras'));
  let batch = writeBatch(db);
  let cCount = 0;
  for (const d of comprasSnap.docs) {
    if (!clientIds.has(d.data().clienteId)) {
      console.log('Orphan compra:', d.id);
      batch.delete(d.ref);
      cCount++;
    }
  }

  const prodSnap = await getDocs(collection(db, 'produtos_comprados'));
  for (const d of prodSnap.docs) {
    if (!clientIds.has(d.data().clienteId)) {
      console.log('Orphan produto:', d.id);
      batch.delete(d.ref);
      cCount++;
    }
  }

  if (cCount > 0) {
    await batch.commit();
    console.log(`Deleted ${cCount} orphans.`);
  } else {
    console.log('No orphans found.');
  }
}

clean().catch(console.error);
