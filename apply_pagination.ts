import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const regex = /async getClientesPaginated\([\s\S]*?return \{\n\s*clientes: results,\n\s*lastDoc: snapshot\.docs\[snapshot\.docs\.length - 1\],\n\s*hasMore: snapshot\.docs\.length === limitNum\n\s*\};\n\s*\}/;

const newPagination = `
  async getClientesPaginated(
    limitNum: number, 
    lastDoc?: DocumentSnapshot, 
    filters?: { whatsapp?: 'in' | 'out', search?: string, produtoId?: string, tag?: string },
    sortField?: string,
    sortDesc?: boolean
  ) {
    const { collection, getDocs, query, orderBy, limit, startAfter, where } = require('firebase/firestore');
    
    let actualSortField = 'numero';
    if (sortField === 'nome') actualSortField = 'nome';
    if (sortField === 'primeiraCompra') actualSortField = 'dataPrimeiraCompra';
    if (sortField === 'ultimaCompra') actualSortField = 'dataUltimaCompra';
    if (sortField === 'totalCompras') actualSortField = 'quantidadeCompras';
    if (sortField === 'totalProdutos') actualSortField = 'quantidadeProdutos';

    const direction = sortDesc ? 'desc' : 'asc';
    
    const results: Cliente[] = [];
    let currentLastDoc = lastDoc;
    let hasMore = true;
    
    while (results.length < limitNum && hasMore) {
      let constraints: any[] = [];
      
      let arrayFilterValue = null;
      if (filters?.produtoId) {
         arrayFilterValue = filters.produtoId;
      } else if (filters?.tag) {
         arrayFilterValue = filters.tag;
      } else if (filters?.search) {
         arrayFilterValue = filters.search.toLowerCase();
      }
      
      if (arrayFilterValue) {
         constraints.push(where('termosBusca', 'array-contains', arrayFilterValue));
      }

      if (filters?.whatsapp === 'in') constraints.push(where('estaNoGrupo', '==', true));
      if (filters?.whatsapp === 'out') constraints.push(where('estaNoGrupo', '==', false));

      constraints.push(orderBy(actualSortField, direction));
      
      const fetchLimit = limitNum; 
      constraints.push(limit(fetchLimit));
      
      if (currentLastDoc) {
        constraints.push(startAfter(currentLastDoc));
      }

      const q = query(collection(db, 'clientes'), ...constraints);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        hasMore = false;
        break;
      }
      
      currentLastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      for (const d of snapshot.docs) {
        const data = d.data();
        let matches = true;
        
        if (filters?.produtoId) {
           if (filters.tag && !(data.etiquetas || []).includes(filters.tag)) matches = false;
           if (filters.search && !(data.termosBusca || []).some((t: string) => t.includes(filters.search!.toLowerCase()))) matches = false;
        } else if (filters?.tag) {
           if (filters.search && !(data.termosBusca || []).some((t: string) => t.includes(filters.search!.toLowerCase()))) matches = false;
        }
        
        if (matches) {
           results.push({ ...data, email: d.id } as Cliente);
           if (results.length === limitNum) {
              currentLastDoc = d;
              break;
           }
        }
      }
      
      if (snapshot.docs.length < fetchLimit) {
        hasMore = false;
      }
    }

    return {
      clientes: results,
      lastDoc: currentLastDoc,
      hasMore
    };
  }`;

content = content.replace(regex, newPagination.trim());
fs.writeFileSync('src/services/clientService.ts', content);

// Also fix Importar.tsx computeTermos signature
let imp = fs.readFileSync('src/pages/Importar.tsx', 'utf8');
imp = imp.replace(/const computeTermos = \(c: any\) => \{/, 'const computeTermos = (c: any, prods: string[] = [], tags: string[] = []) => {');
fs.writeFileSync('src/pages/Importar.tsx', imp);

