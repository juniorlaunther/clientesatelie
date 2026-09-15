import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, "ai-studio-81be4f42-de43-48c5-9c71-1bd0049bba5a");

async function wipe() {
  const { doc } = await import('firebase/firestore');
  const batchLimit = 400;
  
  const collections = ['clientes', 'compras', 'produtos_comprados', 'produtos_catalogo', 'estatisticas'];
  
  for (const coll of collections) {
    let hasDocs = true;
    while (hasDocs) {
      const snap = await getDocs(collection(db, coll));
      if (snap.empty) {
        hasDocs = false;
        continue;
      }
      
      const { writeBatch } = await import('firebase/firestore');
      let batch = writeBatch(db);
      let count = 0;
      
      for (const d of snap.docs) {
        batch.delete(d.ref);
        count++;
        if (count >= batchLimit) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
      }
      if (count > 0) {
        await batch.commit();
      }
      console.log(`Wiped ${snap.size} from ${coll}`);
    }
  }
  
  console.log("Database successfully wiped.");
  process.exit(0);
}

wipe().catch(console.error);
