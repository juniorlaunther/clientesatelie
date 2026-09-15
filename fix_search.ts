import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const regex = /async getClientesPaginated\([\s\S]*?lastDoc: snapshot\.docs\.length > 0 \? snapshot\.docs\[snapshot\.docs\.length - 1\] : undefined\n\s*};\n\s*\},/;

const newPagination = `
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
    if (sortField === 'nome') actualSortField = 'nome';
    if (sortField === 'primeiraCompra') actualSortField = 'dataPrimeiraCompra';
    if (sortField === 'ultimaCompra') actualSortField = 'dataUltimaCompra';
    if (sortField === 'totalCompras') actualSortField = 'quantidadeCompras';
    if (sortField === 'totalProdutos') actualSortField = 'quantidadeProdutos';

    // If searching by exact number, sorting by number is redundant but safe.
    // However, equality filters must be ordered by the same field first in some cases,
    // but here we just order by the requested field.
    constraints.push(orderBy(actualSortField, sortDesc ? 'desc' : 'asc'));
    
    if (actualSortField !== 'numero') {
      constraints.push(orderBy('numero', sortDesc ? 'desc' : 'asc'));
    }

    if (lastDoc) constraints.push(startAfter(lastDoc));
    constraints.push(limit(limitNum));

    const q = query(clientesRef, ...constraints);
    const snapshot = await getDocs(q);
    
    return {
      data: snapshot.docs.map(doc => ({ ...doc.data(), email: doc.id } as Cliente)),
      lastDoc: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : undefined
    };
  },`;

content = content.replace(regex, newPagination.trim() + ',');
fs.writeFileSync('src/services/clientService.ts', content);
