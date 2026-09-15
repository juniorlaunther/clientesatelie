import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const prodsRef = collection(db, 'produtos_comprados');
  const snap = await getDocs(prodsRef);
  const products = snap.docs.map(d => d.data());
  
  const bg = products.filter(p => p.nomeProduto.toLowerCase().includes('brasil goods'));
  console.log("Brasil Goods products:", bg.length > 0 ? bg.slice(0, 2) : "None found");
  process.exit(0);
}
run().catch(console.error);
