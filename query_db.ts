import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const prodsRef = collection(db, 'produtos_comprados');
  const snap = await getDocs(prodsRef);
  const products = snap.docs.map(d => d.data());
  
  const counts: Record<string, any> = {};
  for (const p of products) {
    const cp = p.codigoProduto;
    if (!counts[cp]) counts[cp] = { names: new Set(), count: 0, priceCodes: new Set() };
    counts[cp].count++;
    counts[cp].names.add(p.nomeProduto);
    counts[cp].priceCodes.add(p.codigoPreco);
  }
  
  for (const cp in counts) {
    counts[cp].names = Array.from(counts[cp].names);
    counts[cp].priceCodes = Array.from(counts[cp].priceCodes);
  }
  console.log(JSON.stringify(counts, null, 2));

  const importRef = collection(db, 'importacoes');
  const importSnap = await getDocs(importRef);
  const imports = importSnap.docs.map(d => d.data());
  console.log("Imports:", imports.map(i => ({id: i.id, date: new Date(i.data).toISOString(), erros: i.erros, conflitos: i.conflitos, file: i.nomeArquivo})));
  process.exit(0);
}
run().catch(console.error);
