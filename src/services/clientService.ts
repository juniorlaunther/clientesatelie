import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, writeBatch, query, where, orderBy, limit, startAfter, QueryConstraint, DocumentSnapshot } from 'firebase/firestore';
import { Cliente, Compra, ProdutoVendido } from '../types';
import { statsService } from './statsService';
import { catalogService } from './catalogService';
import { getCountFromServer } from 'firebase/firestore';

export const clientService = {
  async recalcularResumoCliente(clienteId: string): Promise<void> {
        
    const comprasSnap = await getDocs(query(collection(db, 'compras'), where('clienteId', '==', clienteId)));
    const prodSnap = await getDocs(query(collection(db, 'produtos_comprados'), where('clienteId', '==', clienteId)));
    
    let quantidadeCompras = 0;
    let dataUltimaCompra = 0;
    let dataPrimeiraCompra = Number.MAX_SAFE_INTEGER;
    let codigoPrimeiraCompra = '';
    
    comprasSnap.forEach(d => {
       quantidadeCompras++;
       const dt = d.data().dataTransacao;
       if (dt > dataUltimaCompra) dataUltimaCompra = dt;
       if (dt < dataPrimeiraCompra) {
          dataPrimeiraCompra = dt;
          codigoPrimeiraCompra = d.id;
       }
    });

    if (quantidadeCompras === 0) {
       dataPrimeiraCompra = 0;
       codigoPrimeiraCompra = '';
    }
    
    const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
    const catalogData = catalogSnap.docs.map(d => ({id: d.id, codigos: d.data().codigosProduto || []}));
    
    const produtosCompradosIdsSet = new Set<string>();
    
    prodSnap.forEach(d => {
       const cod = d.data().codigoProduto;
       const cat = catalogData.find(c => c.codigos.includes(cod));
       if (cat) produtosCompradosIdsSet.add(cat.id);
    });
    
    const produtosCompradosIds = Array.from(produtosCompradosIdsSet);
    
    // Create maps for efficient querying without multiple array-contains
        
    const clienteSnap = await getDoc(doc(db, 'clientes', clienteId));
    if (!clienteSnap.exists()) return;
    const cData = clienteSnap.data();
    
    const etiquetas = cData.etiquetas || [];
        
    const termos = [
      cData.nome?.toLowerCase(),
      cData.emailOriginal?.toLowerCase(),
      cData.telefoneOriginal?.toLowerCase(),
      ...produtosCompradosIds,
      ...(cData.etiquetas || [])
    ].filter(Boolean);
    
    await updateDoc(doc(db, 'clientes', clienteId), {
       quantidadeCompras,
       dataUltimaCompra,
       dataPrimeiraCompra: quantidadeCompras > 0 ? dataPrimeiraCompra : cData.dataPrimeiraCompra,
       codigoPrimeiraCompra: quantidadeCompras > 0 ? codigoPrimeiraCompra : cData.codigoPrimeiraCompra,
       produtosCompradosIds,
       quantidadeProdutos: produtosCompradosIds.length,
       termosBusca: termos
    });
  },

  async getQtdClientes(filters?: { whatsapp?: 'in' | 'out', search?: string, produtoId?: string, tag?: string }): Promise<number> {
        const clientesRef = collection(db, 'clientes');
    let constraints: any[] = [];
    if (filters?.whatsapp === 'in') constraints.push(where('estaNoGrupo', '==', true));
    if (filters?.whatsapp === 'out') constraints.push(where('estaNoGrupo', '==', false));
    
    if (filters?.produtoId) {
       constraints.push(where('produtosCompradosIds', 'array-contains', filters.produtoId));
    }
    
    if (filters?.tag && !filters?.produtoId && !filters?.search) {
       constraints.push(where('etiquetas', 'array-contains', filters.tag));
    }

    if (filters?.search) {
      if (filters.search.startsWith('#')) {
         const numericValue = parseInt(filters.search.replace('#', ''), 10);
         if (!isNaN(numericValue)) {
            constraints.push(where('numero', '==', numericValue));
         }
      } else {
         constraints.push(where('termosBusca', 'array-contains', filters.search.toLowerCase()));
      }
    }
    const q = query(clientesRef, ...constraints);
    const snap = await getCountFromServer(q);
    return snap.data().count;
  },
  async getClientes(): Promise<Cliente[]> {
    const snapshot = await getDocs(collection(db, 'clientes'));
    return snapshot.docs.map(doc => ({ ...doc.data(), email: doc.id } as Cliente));
  },
  
  async getClientesPaginated(
    limitNum: number, 
    lastDoc?: DocumentSnapshot, 
    filters?: { whatsapp?: 'in' | 'out', search?: string, produtoId?: string, tag?: string },
    sortField?: string,
    sortDesc?: boolean
  ) {
    let constraints: QueryConstraint[] = [];
    const clientesRef = collection(db, 'clientes');

    if (filters?.whatsapp === 'in') constraints.push(where('estaNoGrupo', '==', true));
    if (filters?.whatsapp === 'out') constraints.push(where('estaNoGrupo', '==', false));
    if (filters?.produtoId) constraints.push(where('produtosCompradosIds', 'array-contains', filters.produtoId));
    
    if (filters?.tag && !filters?.produtoId && !filters?.search) {
      constraints.push(where('etiquetas', 'array-contains', filters.tag));
    }

    let isNumericSearch = false;
    let numericValue = 0;
    
    if (filters?.search) {
      if (filters.search.startsWith('#')) {
         isNumericSearch = true;
         numericValue = parseInt(filters.search.replace('#', ''), 10);
         if (!isNaN(numericValue)) {
            constraints.push(where('numero', '==', numericValue));
         }
      } else if (!filters?.produtoId && !filters?.tag) {
         constraints.push(where('termosBusca', 'array-contains', filters.search.toLowerCase()));
      }
    }

    let actualSortField = 'numero';
    let actualSortDesc = sortDesc ? true : false;
    
    const hasArrayFilter = filters?.produtoId || filters?.tag || (filters?.search && !isNumericSearch);
    const hasEqualityFilter = filters?.whatsapp === 'in' || filters?.whatsapp === 'out' || isNumericSearch;

    if (hasArrayFilter || hasEqualityFilter) {
       actualSortField = 'numero';
       actualSortDesc = false; // Force ASCENDING to minimize composite indexes
    } else {
       if (sortField === 'nome') actualSortField = 'nome';
       if (sortField === 'primeiraCompra') actualSortField = 'dataPrimeiraCompra';
       if (sortField === 'ultimaCompra') actualSortField = 'dataUltimaCompra';
       if (sortField === 'totalCompras') actualSortField = 'quantidadeCompras';
       if (sortField === 'totalProdutos') actualSortField = 'quantidadeProdutos';
    }

    // Se a busca for exata pelo numero, o firestore exige a ordenacao no mesmo campo.
    constraints.push(orderBy(actualSortField, actualSortDesc ? 'desc' : 'asc'));
    
    if (actualSortField !== 'numero') {
      constraints.push(orderBy('numero', actualSortDesc ? 'desc' : 'asc'));
    }

    if (lastDoc) constraints.push(startAfter(lastDoc));
    constraints.push(limit(limitNum));

    const q = query(clientesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      data: snapshot.docs.map(doc => ({ ...doc.data(), email: doc.id } as Cliente)),
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined
    };
  },

  async getComprasPaginated(limitNum: number, lastDoc?: DocumentSnapshot) {
    const comprasRef = collection(db, 'compras');
    let constraints: QueryConstraint[] = [orderBy('dataTransacao', 'desc'), limit(limitNum)];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    
    const q = query(comprasRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      data: snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Compra)),
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined
    };
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
    
    // Check if we need to update termosBusca
    if (data.nome !== undefined || data.telefoneOriginal !== undefined || data.emailOriginal !== undefined || data.etiquetas !== undefined) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
         const current = snap.data();
         const merged = { ...current, ...data };
         const termos = [
            merged.nome?.toLowerCase(),
            merged.emailOriginal?.toLowerCase(),
            merged.telefoneOriginal?.toLowerCase(),
            ...(merged.produtosCompradosIds || []),
            ...(merged.etiquetas || [])
         ].filter(Boolean);
         data.termosBusca = termos;
      }
    }
    
    await updateDoc(docRef, data);
    if (data.estaNoGrupo !== undefined) {
      await statsService.atualizarEstatisticasGerais();
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
    const compras = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Compra));
    return compras.sort((a, b) => b.dataTransacao - a.dataTransacao);
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
    return {
      totalClientes: 0, novosClientes: 0, compras: 0, produtosVendidos: 0, inGroup: 0, notInGroup: 0, productCounts: {}
    };
  },

  async createCompraEProduto(compra: Compra, produto: ProdutoVendido): Promise<void> {
        const batch = writeBatch(db);
    batch.set(doc(db, 'compras', compra.id), compra);
    batch.set(doc(db, 'produtos_comprados', produto.id), produto);
    await batch.commit();
    
    // Check if we need to recalcularNumeracao
    const cSnap = await getDoc(doc(db, 'clientes', compra.clienteId));
    let needsRenumbering = false;
    if (cSnap.exists()) {
       const cData = cSnap.data();
       if (compra.dataTransacao < cData.dataPrimeiraCompra) {
          needsRenumbering = true;
       }
    }
    
    await this.recalcularResumoCliente(compra.clienteId);
    if (needsRenumbering) {
       await this.recalcularNumeracao(compra.clienteId);
    }
    await statsService.atualizarEstatisticasGerais();
    
    // Trigger product recalculation
    if (produto.codigoProduto) {
       const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
       const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(produto.codigoProduto));
       if (cat) await catalogService.recalcularResumoProduto(cat.id);
    }
  },

  async deleteCompraEProdutos(compraId: string): Promise<void> {
    const q = query(collection(db, 'produtos_comprados'), where('compraId', '==', compraId));
    const snapshot = await getDocs(q);
    
    let clienteId = '';
    const batch = writeBatch(db);
    const codigosAfetados: string[] = [];
    snapshot.docs.forEach(d => {
      clienteId = d.data().clienteId;
      if (d.data().codigoProduto) codigosAfetados.push(d.data().codigoProduto);
      batch.delete(d.ref);
    });
    batch.delete(doc(db, 'compras', compraId));
    
    await batch.commit();
    if (clienteId) {
      await this.recalcularNumeracao(clienteId);
    }

    const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
    for (const cod of codigosAfetados) {
       const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(cod));
       if (cat) await catalogService.recalcularResumoProduto(cat.id);
    }
    await statsService.atualizarEstatisticasGerais();
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

  async _deleteRelatedRecords(email: string, batch: any, ops: { count: number }, codigosProdutos: Set<string>) {
    const qCompras = query(collection(db, 'compras'), where('clienteId', '==', email));
    const snapCompras = await getDocs(qCompras);
    for (const d of snapCompras.docs) {
      batch.delete(d.ref);
      ops.count++;
    }
    const qProd = query(collection(db, 'produtos_comprados'), where('clienteId', '==', email));
    const snapProd = await getDocs(qProd);
    for (const d of snapProd.docs) {
      batch.delete(d.ref);
      codigosProdutos.add(d.data().codigoProduto);
      ops.count++;
    }
  },

  async bulkDeleteClientes(emails: string[]): Promise<void> {
    if (emails.length === 0) return;
    
    let batch = writeBatch(db);
    let ops = { count: 0 };
    const codigosProdutos = new Set<string>();
    
    for (const email of emails) {
      batch.delete(doc(db, 'clientes', email));
      ops.count++;
      
      await this._deleteRelatedRecords(email, batch, ops, codigosProdutos);
      if (ops.count >= 350) {
        await batch.commit();
        batch = writeBatch(db);
        ops.count = 0;
      }
    }
    if (ops.count > 0) {
      await batch.commit();
    }
    
    // Recalculate catalog products
    if (codigosProdutos.size > 0) {
       const catalogSnap = await getDocs(collection(db, 'produtos_catalogo'));
       for (const cod of codigosProdutos) {
          const cat = catalogSnap.docs.find((d: any) => (d.data().codigosProduto || []).includes(cod));
          if (cat) await catalogService.recalcularResumoProduto(cat.id);
       }
    }

    await this.recalcularNumeracao();
    await statsService.atualizarEstatisticasGerais();
  },

  async recalcularNumeracao(afetadoClienteId?: string): Promise<void> {
    // Highly optimized. If order hasn't changed, this is just to verify first purchases.
    const clientesSnap = await getDocs(query(collection(db, 'clientes'), orderBy('dataPrimeiraCompra', 'asc')));
    let clientes = clientesSnap.docs.map(d => ({ ...d.data(), email: d.id } as Cliente));

    // Sort remaining clients by first purchase date, then by first purchase code
    clientes.sort((a, b) => {
      if (a.dataPrimeiraCompra !== b.dataPrimeiraCompra) {
        return a.dataPrimeiraCompra - b.dataPrimeiraCompra;
      }
      if (a.codigoPrimeiraCompra && b.codigoPrimeiraCompra) {
        return a.codigoPrimeiraCompra.localeCompare(b.codigoPrimeiraCompra);
      }
      return 0;
    });

    let batch = writeBatch(db);
    let opCount = 0;
    let expectedNumber = 1;
    
    for (const c of clientes) {
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
