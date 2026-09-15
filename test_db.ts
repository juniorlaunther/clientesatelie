import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const catRef = collection(db, 'produtos_catalogo');
  const snap = await getDocs(catRef);
  const cat = snap.docs.map(d => d.data());
  console.log(JSON.stringify(cat.map(c => ({nomeOficial: c.nomeOficial, codigosProduto: c.codigosProduto, nomesAlternativos: c.nomesAlternativos})), null, 2));
  process.exit(0);
}
run().catch(console.error);
