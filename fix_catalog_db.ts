import { config } from 'dotenv';
config();

import { db } from './src/lib/firebase';
import { catalogService } from './src/services/catalogService';
import { getDocs, collection } from 'firebase/firestore';

async function run() {
  console.log("Recalculating stats for all catalog products...");
  const snap = await getDocs(collection(db, 'produtos_catalogo'));
  
  let i = 0;
  for (const d of snap.docs) {
    const id = d.id;
    await catalogService.recalcularResumoProduto(id);
    i++;
    if (i % 10 === 0) console.log(`Processed ${i} / ${snap.docs.length}`);
  }
  console.log("Done!");
}

run().catch(console.error);
