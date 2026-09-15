import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, writeBatch, query, where } from 'firebase/firestore';
import { ProdutoCatalogo, ProdutoVendido } from '../types';

export const catalogService = {
  async recalcularResumoProduto(produtoId: string): Promise<void> {
        
    const catSnap = await getDoc(doc(db, 'produtos_catalogo', produtoId));
    if (!catSnap.exists()) return;
    const cat = catSnap.data() as ProdutoCatalogo;
    
    // We can't do an 'in' query if the array is large, but usually codigosProduto is < 10
    // To be safe, we fetch all purchases that match.
    // Wait, the page Clientes doesn't read the whole collection anymore, but this recalculates ONE product.
    // If the product has many codes, we can chunk them.
    let totalUnidades = 0;
    const clientesSet = new Set<string>();
    let primeira = Infinity;
    let ultima = 0;
    
    const codigos = cat.codigosProduto || [];
    
    // We query by codigoProduto in batches of 30
    for (let i = 0; i < codigos.length; i += 30) {
       const chunk = codigos.slice(i, i + 30);
       const q = query(collection(db, 'produtos_comprados'), where('codigoProduto', 'in', chunk));
       const pSnap = await getDocs(q);
       pSnap.docs.forEach(d => {
          totalUnidades++;
          clientesSet.add(d.data().clienteId);
          const dt = d.data().dataTransacao;
          if (dt < primeira) primeira = dt;
          if (dt > ultima) ultima = dt;
       });
    }
    
    await updateDoc(doc(db, 'produtos_catalogo', produtoId), {
       unidadesVendidas: totalUnidades,
       clientesUnicos: clientesSet.size,
       primeiraVenda: primeira === Infinity ? null : primeira,
       ultimaVenda: ultima === 0 ? null : ultima
    });
  },

  async getCatalog(): Promise<ProdutoCatalogo[]> {
    const snap = await getDocs(collection(db, 'produtos_catalogo'));
    return snap.docs.map(d => d.data() as ProdutoCatalogo);
  },
  
  async getCatalogWithStats() {
    const [catSnap, prodSnap] = await Promise.all([
      getDocs(collection(db, 'produtos_catalogo')),
      getDocs(collection(db, 'produtos_comprados'))
    ]);
    
    const catalog = catSnap.docs.map(d => d.data() as ProdutoCatalogo);
    const produtos = prodSnap.docs.map(d => d.data() as ProdutoVendido);
    
    const statsMap = new Map<string, {
      unidadesVendidas: number;
      clientes: Set<string>;
      primeiraVenda: number;
      ultimaVenda: number;
    }>();
    
    catalog.forEach(c => {
      statsMap.set(c.id, { unidadesVendidas: 0, clientes: new Set(), primeiraVenda: Infinity, ultimaVenda: 0 });
    });
    
    // Reverse map from product code to catalog ID
    const codeToCat = new Map<string, string>();
    catalog.forEach(c => {
      c.codigosProduto.forEach(code => codeToCat.set(code, c.id));
    });
    
    produtos.forEach(p => {
      const catId = codeToCat.get(p.codigoProduto);
      if (catId) {
        const stats = statsMap.get(catId)!;
        stats.unidadesVendidas++;
        stats.clientes.add(p.clienteId);
        if (p.dataTransacao < stats.primeiraVenda) stats.primeiraVenda = p.dataTransacao;
        if (p.dataTransacao > stats.ultimaVenda) stats.ultimaVenda = p.dataTransacao;
      }
    });
    
    return catalog.map(c => {
      const st = statsMap.get(c.id)!;
      return {
        ...c,
        unidadesVendidas: st.unidadesVendidas,
        clientesUnicos: st.clientes.size,
        primeiraVenda: st.primeiraVenda === Infinity ? null : st.primeiraVenda,
        ultimaVenda: st.ultimaVenda === 0 ? null : st.ultimaVenda
      };
    });
  },

  async updateProduct(id: string, data: Partial<ProdutoCatalogo>): Promise<void> {
    await updateDoc(doc(db, 'produtos_catalogo', id), data);
  },

  async mergeProducts(targetId: string, sourceId: string): Promise<void> {
    const targetRef = doc(db, 'produtos_catalogo', targetId);
    const sourceRef = doc(db, 'produtos_catalogo', sourceId);
    
    const targetSnap = await getDoc(targetRef);
    const sourceSnap = await getDoc(sourceRef);
    
    if (!targetSnap.exists() || !sourceSnap.exists()) return;
    
    const targetData = targetSnap.data() as ProdutoCatalogo;
    const sourceData = sourceSnap.data() as ProdutoCatalogo;
    
    const newCodigosProduto = Array.from(new Set([...targetData.codigosProduto, ...sourceData.codigosProduto]));
    const newCodigosPreco = Array.from(new Set([...targetData.codigosPreco, ...sourceData.codigosPreco]));
    
    const batch = writeBatch(db);
    batch.update(targetRef, {
      codigosProduto: newCodigosProduto,
      codigosPreco: newCodigosPreco
    });
    batch.delete(sourceRef);
    await batch.commit();
    await this.recalcularResumoProduto(targetId);
  },
  
  async splitCode(productId: string, codeToSplit: string, codeType: 'produto' | 'preco', newName: string): Promise<void> {
    const prodRef = doc(db, 'produtos_catalogo', productId);
    const snap = await getDoc(prodRef);
    if (!snap.exists()) return;
    const data = snap.data() as ProdutoCatalogo;
    
    let newCodigosProduto = [...data.codigosProduto];
    let newCodigosPreco = [...data.codigosPreco];
    
    if (codeType === 'produto') {
      newCodigosProduto = newCodigosProduto.filter(c => c !== codeToSplit);
    } else {
      newCodigosPreco = newCodigosPreco.filter(c => c !== codeToSplit);
    }
    
    const newId = `CAT-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newProduct: ProdutoCatalogo = {
      id: newId,
      nomeOficial: newName,
      nomeNormalizado: newName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase(),
      codigosProduto: codeType === 'produto' ? [codeToSplit] : [],
      codigosPreco: codeType === 'preco' ? [codeToSplit] : []
    };
    
    const batch = writeBatch(db);
    batch.update(prodRef, { codigosProduto: newCodigosProduto, codigosPreco: newCodigosPreco });
    batch.set(doc(db, 'produtos_catalogo', newId), newProduct);
    await batch.commit();
    await this.recalcularResumoProduto(productId);
    await this.recalcularResumoProduto(newId);
  }
};
