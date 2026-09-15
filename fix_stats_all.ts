import { catalogService } from './src/services/catalogService';
import { statsService } from './src/services/statsService';
import { db } from './src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function run() {
  const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
  for (const doc of catalogSnap.docs) {
    await catalogService.recalcularResumoProduto(doc.id);
  }
  await statsService.atualizarEstatisticasGerais();
  console.log("Done");
}
run();
