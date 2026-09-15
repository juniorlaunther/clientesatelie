import { db } from '../lib/firebase';
import { collection, doc, writeBatch, getDocs, query, orderBy, limit, getDoc, updateDoc, where, documentId } from 'firebase/firestore';
import { Cliente, ProdutoVendido, Importacao, ProdutoCatalogo } from '../types';
import { clientService } from './clientService';
import { statsService } from './statsService';

export const importService = {
  async getLastSuccessfulImport(): Promise<Importacao | null> {
        const q = query(collection(db, 'importacoes'), orderBy('data', 'desc'), limit(20));
    const snap = await getDocs(q);
    const doc = snap.docs.find(d => d.data().status === 'concluida');
    if (!doc) return null;
    return { ...doc.data(), id: doc.id } as Importacao;
  },

  async undoImport(importId: string): Promise<void> {
    const docRef = doc(db, 'importacoes', importId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Importação não encontrada.');
    const imp = snap.data() as Importacao;
    
    if (imp.status !== 'concluida') throw new Error('Apenas importações concluídas podem ser desfeitas.');
    
    const { transactionIds = [], baseCompraIds = [], newClientEmails = [], updatedClientEmails = [], newCatalogIds = [] } = imp;
    
    let batch = writeBatch(db);
    let opCount = 0;
    
    // 1. Delete produtos_comprados
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
        const cat = catSnap.data() as ProdutoCatalogo;
        let hasSale = false;
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
    
    // Recalculate summary fields for updated clients that had some purchases removed
    for (const email of updatedClientEmails) {
       await clientService.recalcularResumoCliente(email);
    }
    
    // Also recalculate updated products
    const updatedCatalogIds = imp.updatedCatalogIds || [];
    for (const catId of updatedCatalogIds) {
       await require('./catalogService').catalogService.recalcularResumoProduto(catId);
    }
    
    // Run full migration/re-calculate on clients that were just "updated" by this import, to restore their states
    await updateDoc(docRef, { status: 'desfeita' });

    await statsService.atualizarEstatisticasGerais();
  },

  async getMaxClientNumber(): Promise<number> {
    const clientesRef = collection(db, 'clientes');
    const q = query(clientesRef, orderBy('numero', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 0;
    return snapshot.docs[0].data().numero;
  },

  async getAllClients(): Promise<Map<string, Cliente>> {
    const clientesRef = collection(db, 'clientes');
    const snapshot = await getDocs(clientesRef);
    const clients = new Map<string, Cliente>();
    snapshot.forEach(doc => {
      clients.set(doc.id, doc.data() as Cliente);
    });
    return clients;
  },

  async getAllPhones(): Promise<Map<string, string>> {
    const clientesRef = collection(db, 'clientes');
    const snapshot = await getDocs(clientesRef);
    const phones = new Map<string, string>(); // telefone -> email
    snapshot.forEach(doc => {
      const data = doc.data() as Cliente;
      if (data.telefone) {
        phones.set(data.telefone, data.email);
      }
    });
    return phones;
  },

  async getValidExistingTransactions(transactionIds: string[], existingClients: Map<string, Cliente>): Promise<Set<string>> {
    const existing = new Set<string>();
    const chunkSize = 30; // Firestore limit for 'in' operator is 30
    
    for (let i = 0; i < transactionIds.length; i += chunkSize) {
      const chunk = transactionIds.slice(i, i + chunkSize);
      
      const q = query(collection(db, 'produtos_comprados'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      
      snap.forEach(doc => {
        const data = doc.data() as ProdutoVendido;
        if (existingClients.has(data.clienteId)) {
          existing.add(doc.id);
        }
      });
    }
    return existing;
  }
};
