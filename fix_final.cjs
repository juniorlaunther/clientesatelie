const fs = require('fs');

const fullCode = `import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, orderBy } from 'firebase/firestore';
import { Cliente, Compra, ProdutoVendido } from '../types';

export const clientService = {
  async getClientes(): Promise<Cliente[]> {
    const snapshot = await getDocs(collection(db, 'clientes'));
    return snapshot.docs.map(doc => ({ ...doc.data(), email: doc.id } as Cliente));
  },
  
  async getCliente(email: string): Promise<Cliente | null> {
    const docRef = doc(db, 'clientes', email);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...snapshot.data(), email: snapshot.id } as Cliente;
    }
    return null;
  },

  async updateCliente(email: string, data: Partial<Cliente>): Promise<void> {
    const docRef = doc(db, 'clientes', email);
    await updateDoc(docRef, data);
  },

  async deleteCliente(email: string): Promise<void> {
    const docRef = doc(db, 'clientes', email);
    await deleteDoc(docRef);
    await this.recalcularNumeracao();
  },

  async getAllCompras(): Promise<Compra[]> {
    const snapshot = await getDocs(collection(db, 'compras'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Compra));
  },

  async getAllProdutos(): Promise<ProdutoVendido[]> {
    const snapshot = await getDocs(collection(db, 'produtos_comprados'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProdutoVendido));
  },

  async getComprasByCliente(email: string): Promise<Compra[]> {
    const q = query(collection(db, 'compras'), where('clienteId', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Compra));
  },

  async getProdutosByCompra(compraId: string): Promise<ProdutoVendido[]> {
    const q = query(collection(db, 'produtos_comprados'), where('compraId', '==', compraId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProdutoVendido));
  },

  async getProdutosByCliente(email: string): Promise<ProdutoVendido[]> {
    const q = query(collection(db, 'produtos_comprados'), where('clienteId', '==', email));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProdutoVendido));
  },

  async getDashboardStats(startDate: number, endDate: number) {
    const q = query(
      collection(db, 'produtos_comprados'), 
      where('dataTransacao', '>=', startDate),
      where('dataTransacao', '<=', endDate)
    );
    const snapshot = await getDocs(q);
    const produtos = snapshot.docs.map(doc => doc.data() as ProdutoVendido);
    
    const qc = query(
      collection(db, 'clientes'),
      where('dataPrimeiraCompra', '>=', startDate),
      where('dataPrimeiraCompra', '<=', endDate)
    );
    const clientsSnap = await getDocs(qc);
    const novosClientesCount = clientsSnap.size;

    const allClientsSnap = await getDocs(collection(db, 'clientes'));
    const totalClientes = allClientsSnap.size;
    let inGroup = 0;
    allClientsSnap.forEach(d => {
      if (d.data().estaNoGrupo) inGroup++;
    });
    const notInGroup = totalClientes - inGroup;

    const comprasInPeriod = new Set<string>();
    produtos.forEach(p => comprasInPeriod.add(p.compraId));

    const productCounts: Record<string, number> = {};
    produtos.forEach(p => {
      productCounts[p.nomeProduto] = (productCounts[p.nomeProduto] || 0) + 1;
    });

    return {
      totalClientes,
      novosClientes: novosClientesCount,
      compras: comprasInPeriod.size,
      produtosVendidos: produtos.length,
      inGroup,
      notInGroup,
      productCounts
    };
  },

  async createCompraEProduto(compra: Compra, produto: ProdutoVendido): Promise<void> {
    const batch = writeBatch(db);
    batch.set(doc(db, 'compras', compra.id), compra);
    batch.set(doc(db, 'produtos_comprados', produto.id), produto);
    await batch.commit();
  },

  async deleteCompraEProdutos(compraId: string): Promise<void> {
    const q = query(collection(db, 'produtos_comprados'), where('compraId', '==', compraId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.delete(d.ref);
    });
    batch.delete(doc(db, 'compras', compraId));
    
    await batch.commit();
  },

  async bulkUpdateClientes(emails: string[], data: Partial<Cliente>): Promise<void> {
    let batch = writeBatch(db);
    let opCount = 0;
    
    for (const email of emails) {
      batch.update(doc(db, 'clientes', email), data);
      opCount++;
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
    if (opCount > 0) {
      await batch.commit();
    }
  },

  async bulkDeleteClientes(emails: string[]): Promise<void> {
    let batch = writeBatch(db);
    let opCount = 0;
    for (const email of emails) {
      batch.delete(doc(db, 'clientes', email));
      opCount++;
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }
    if (opCount > 0) {
      await batch.commit();
    }
    await this.recalcularNumeracao();
  },

  async recalcularNumeracao(): Promise<void> {
    const clientesRef = collection(db, 'clientes');
    const q = query(clientesRef, orderBy('numero', 'asc'));
    const snapshot = await getDocs(q);
    
    let batch = writeBatch(db);
    let opCount = 0;
    let expectedNumber = 1;
    
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.numero !== expectedNumber) {
        batch.update(d.ref, { numero: expectedNumber });
        opCount++;
        if (opCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          opCount = 0;
        }
      }
      expectedNumber++;
    }
    
    if (opCount > 0) {
      await batch.commit();
    }
  }
};
`;

fs.writeFileSync('src/services/clientService.ts', fullCode);
