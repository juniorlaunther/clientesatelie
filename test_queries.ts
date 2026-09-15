import { db } from './src/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

async function run() {
  const q = query(
    collection(db, 'clientes'),
    where('produtosCompradosIds', 'array-contains', 'CAT-1788991184449-98'),
    orderBy('numero', 'desc'),
    limit(5)
  );
  try {
    const snap = await getDocs(q);
    console.log(`Found ${snap.size} docs`);
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}
run();
