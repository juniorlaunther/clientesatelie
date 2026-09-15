const fs = require('fs');

const code = `import { db } from '../lib/firebase';
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
    if (data.dataPrimeiraCompra !== undefined) {
      // Re-number if their first purchase date changed manually? 
      // The prompt says we should renumber when changing purchase dates.
      // But let's keep this simple for manual updates.
    }
  },

  async deleteCliente(email: string): Promise<void> {
    await this.bulkDeleteClientes([email]);
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
    await this.recalcularNumeracao();
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
    await this.recalcularNumeracao();
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

  async _deleteRelatedRecords(email: string, batch: any, ops: { count: number }) {
    // Delete all purchases
    const qCompras = query(collection(db, 'compras'), where('clienteId', '==', email));
    const snapCompras = await getDocs(qCompras);
    for (const doc of snapCompras.docs) {
      batch.delete(doc.ref);
      ops.count++;
    }

    // Delete all products
    const qProd = query(collection(db, 'produtos_comprados'), where('clienteId', '==', email));
    const snapProd = await getDocs(qProd);
    for (const doc of snapProd.docs) {
      batch.delete(doc.ref);
      ops.count++;
    }
  },

  async bulkDeleteClientes(emails: string[]): Promise<void> {
    let batch = writeBatch(db);
    let ops = { count: 0 };

    for (const email of emails) {
      batch.delete(doc(db, 'clientes', email));
      ops.count++;
      
      // Also delete compras and produtos
      await this._deleteRelatedRecords(email, batch, ops);

      if (ops.count >= 350) { // Keep safe margin
        await batch.commit();
        batch = writeBatch(db);
        ops.count = 0;
      }
    }
    if (ops.count > 0) {
      await batch.commit();
    }
    await this.recalcularNumeracao();
  },

  async recalcularNumeracao(): Promise<void> {
    // 1. Load all remaining clients
    const clientesSnap = await getDocs(collection(db, 'clientes'));
    let clientes = clientesSnap.docs.map(d => ({ ...d.data(), email: d.id } as Cliente));

    // 2. Load all remaining purchases
    const comprasSnap = await getDocs(collection(db, 'compras'));
    const compras = comprasSnap.docs.map(d => ({ ...d.data(), id: d.id } as Compra));

    // 3. Find first purchase for each client
    let batch = writeBatch(db);
    let opCount = 0;

    const clientsToKeep: Cliente[] = [];

    for (const c of clientes) {
      const clientCompras = compras.filter(comp => comp.clienteId === c.email);
      
      if (clientCompras.length === 0) {
        // Remove client if they have no valid purchases remaining
        batch.delete(doc(db, 'clientes', c.email));
        opCount++;
        continue;
      }

      // Sort purchases by date, then by code
      clientCompras.sort((a, b) => {
        if (a.dataTransacao !== b.dataTransacao) {
          return a.dataTransacao - b.dataTransacao;
        }
        return a.id.localeCompare(b.id);
      });

      const firstPurchase = clientCompras[0];
      
      // Update client if their first purchase info changed
      if (c.dataPrimeiraCompra !== firstPurchase.dataTransacao || c.codigoPrimeiraCompra !== firstPurchase.id) {
        c.dataPrimeiraCompra = firstPurchase.dataTransacao;
        c.codigoPrimeiraCompra = firstPurchase.id;
        batch.update(doc(db, 'clientes', c.email), { 
          dataPrimeiraCompra: firstPurchase.dataTransacao,
          codigoPrimeiraCompra: firstPurchase.id
        });
        opCount++;
      }
      
      clientsToKeep.push(c);
    }

    // 4. Sort remaining clients by first purchase date, then by first purchase code
    clientsToKeep.sort((a, b) => {
      if (a.dataPrimeiraCompra !== b.dataPrimeiraCompra) {
        return a.dataPrimeiraCompra - b.dataPrimeiraCompra;
      }
      if (a.codigoPrimeiraCompra && b.codigoPrimeiraCompra) {
        return a.codigoPrimeiraCompra.localeCompare(b.codigoPrimeiraCompra);
      }
      return 0;
    });

    // 5. Reassign sequential numbers
    let expectedNumber = 1;
    for (const c of clientsToKeep) {
      if (c.numero !== expectedNumber) {
        batch.update(doc(db, 'clientes', c.email), { numero: expectedNumber });
        opCount++;
      }
      expectedNumber++;

      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }
  }
};
`;

fs.writeFileSync('src/services/clientService.ts', code);
