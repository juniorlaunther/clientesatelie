import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

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
      
      // Determine the BEST single array-contains filter to send to DB
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

      // We can safely add the boolean filter
      if (filters?.whatsapp === 'in') constraints.push(where('estaNoGrupo', '==', true));
      if (filters?.whatsapp === 'out') constraints.push(where('estaNoGrupo', '==', false));

      constraints.push(orderBy(actualSortField, direction));
      
      // Since we might filter in memory, we fetch a bit more per chunk to minimize loops, 
      // but not too much to save reads.
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
        
        // Memory filters for whatever couldn't go to DB
        // If we queried by produtoId, we need to manually check tag and search
        if (filters?.produtoId) {
           if (filters.tag && !(data.etiquetas || []).includes(filters.tag)) matches = false;
           if (filters.search && !(data.termosBusca || []).some((t: string) => t.includes(filters.search!.toLowerCase()))) matches = false;
        } else if (filters?.tag) {
           if (filters.search && !(data.termosBusca || []).some((t: string) => t.includes(filters.search!.toLowerCase()))) matches = false;
        }
        
        if (matches) {
           results.push({ ...data, email: d.id } as Cliente);
           if (results.length === limitNum) {
              // We reached the exact limit. If there are more docs in this snapshot, 
              // we can't easily set currentLastDoc for the next pagination without over-fetching.
              // Wait, if we break early, currentLastDoc would be wrong for the NEXT page.
              // So we MUST use the current doc as currentLastDoc!
              currentLastDoc = d;
              break;
           }
        }
      }
      
      if (snapshot.docs.length < fetchLimit) {
        hasMore = false; // DB has no more
      }
    }

    return {
      clientes: results,
      lastDoc: currentLastDoc,
      hasMore
    };
  }
`;

const regex = /async getClientesPaginated[\s\S]*?hasMore\s*};\s*\}/;
content = content.replace(regex, newPagination.trim());
fs.writeFileSync('src/services/clientService.ts', content);
