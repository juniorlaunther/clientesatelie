const fs = require('fs');
let code = fs.readFileSync('src/services/importService.ts', 'utf8');

code = code.replace(
  "export const importService = {",
  `import { clientService } from './clientService';
import { catalogService } from './catalogService';

export const importService = {`
);

code = code.replace(
  "export const importService = {",
  `export const importService = {
  async getLastSuccessfulImport(): Promise<Importacao | null> {
    const q = query(collection(db, 'importacoes'), where('status', '==', 'concluida'), orderBy('data', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...snap.docs[0].data(), id: snap.docs[0].id } as Importacao;
  },

  async undoImport(importId: string): Promise<void> {
    const docRef = doc(db, 'importacoes', importId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Importação não encontrada.');
    const imp = snap.data() as Importacao;
    if (imp.status !== 'concluida') throw new Error('Apenas importações concluídas podem ser desfeitas.');
    
    const { transactionIds = [], baseCompraIds = [], newClientEmails = [], updatedClientEmails = [], newCatalogIds = [] } = imp;
    
    // 1. Delete produtos_comprados
    let batch = writeBatch(db);
    let opCount = 0;
    
    for (const id of transactionIds) {
      batch.delete(doc(db, 'produtos_comprados', id));
      opCount++;
      if (opCount >= 400) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
    }
    if (opCount > 0) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
    
    // 2. Delete compras if no valid produtos left
    for (const id of baseCompraIds) {
      const q = query(collection(db, 'produtos_comprados'), where('compraId', '==', id), limit(1));
      const pSnap = await getDocs(q);
      if (pSnap.empty) {
        batch.delete(doc(db, 'compras', id));
        opCount++;
        if (opCount >= 400) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
      }
    }
    if (opCount > 0) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
    
    // 3. Delete completely new clients if no valid compras left
    for (const email of newClientEmails) {
      const q = query(collection(db, 'compras'), where('clienteId', '==', email), limit(1));
      const cSnap = await getDocs(q);
      if (cSnap.empty) {
        batch.delete(doc(db, 'clientes', email));
        opCount++;
        if (opCount >= 400) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
      }
    }
    if (opCount > 0) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
    
    // 4. For catalog products, only delete if no valid sales exist
    for (const id of newCatalogIds) {
      const catSnap = await getDoc(doc(db, 'produtos_catalogo', id));
      if (catSnap.exists()) {
        const cat = catSnap.data();
        let hasSale = false;
        // We could just check all codigosProduto for this cat
        for(const cod of cat.codigosProduto) {
           const q = query(collection(db, 'produtos_comprados'), where('codigoProduto', '==', cod), limit(1));
           const s = await getDocs(q);
           if (!s.empty) { hasSale = true; break; }
        }
        if (!hasSale) {
           batch.delete(doc(db, 'produtos_catalogo', id));
           opCount++;
           if (opCount >= 400) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
        }
      }
    }
    if (opCount > 0) { await batch.commit(); }
    
    // 5. Run recalculation and update status
    await clientService.recalcularNumeracao();
    await updateDoc(docRef, { status: 'desfeita' });
  },`
);

fs.writeFileSync('src/services/importService.ts', code);
