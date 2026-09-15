import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const importRef = collection(db, 'importacoes');
  const importSnap = await getDocs(importRef);
  const imports = importSnap.docs.map(d => d.data());
  const last = imports.sort((a,b) => b.data - a.data)[0];
  console.log("Last import:", JSON.stringify(last, null, 2));
  process.exit(0);
}
run().catch(console.error);
