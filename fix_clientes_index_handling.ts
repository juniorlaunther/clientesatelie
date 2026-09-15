import fs from 'fs';

// 1. Modificar clientService.ts para forçar numero ASC quando há filtros
let service = fs.readFileSync('src/services/clientService.ts', 'utf8');

const sortLogic = `
    let actualSortField = 'numero';
    let actualSortDesc = sortDesc ? true : false;
    
    const hasArrayFilter = filters?.produtoId || filters?.tag || (filters?.search && !isNumericSearch);
    const hasEqualityFilter = filters?.whatsapp === 'in' || filters?.whatsapp === 'out';

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
`;

const replaceRegex = /let actualSortField = 'numero';[\s\S]*?if \(actualSortField !== 'numero'\) \{\n\s*constraints\.push\(orderBy\('numero', sortDesc \? 'desc' : 'asc'\)\);\n\s*\}/;

service = service.replace(replaceRegex, sortLogic.trim());
fs.writeFileSync('src/services/clientService.ts', service);


// 2. Modificar Clientes.tsx para capturar o erro e mostrar o botao
let page = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

if (!page.includes('indexErrorLink')) {
   page = page.replace('const [error, setError] = useState(\'\');', 'const [error, setError] = useState(\'\');\n  const [indexErrorLink, setIndexErrorLink] = useState(\'\');');
   
   const tryCatchBlock = `
    try {
      setLoading(true);
      setError('');
      setIndexErrorLink('');
`;

   page = page.replace(/try \{\n\s*setLoading\(true\);\n\s*setError\(''\);/, tryCatchBlock.trim());

   const catchBlock = `
    } catch (e: any) {
      console.error('Error loading clientes:', e);
      if (e.message && e.message.includes('The query requires an index')) {
        setError('Este filtro precisa de uma configuração adicional no Firebase');
        const urlMatch = e.message.match(/(https:\\/\\/console\\.firebase\\.google\\.com[^\\s]+)/);
        if (urlMatch) {
          setIndexErrorLink(urlMatch[1]);
        }
      } else {
        setError('Falha ao carregar clientes');
      }
    } finally {
`;
   page = page.replace(/\} catch \(e\) \{\n\s*console\.error\('Error loading clientes:', e\);\n\s*setError\('Falha ao carregar clientes'\);\n\s*\} finally \{/, catchBlock.trim());

   const uiError = `
        {error && (
          <div className="p-4 bg-red-50 text-red-600 flex flex-col items-center justify-center space-y-3">
            <p className="font-medium text-center">{error}</p>
            {indexErrorLink && (
               <a 
                 href={indexErrorLink} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
               >
                 Criar índice no Firebase
               </a>
            )}
          </div>
        )}
   `;
   
   page = page.replace(/\{error && \(\n\s*<div className="p-4 bg-red-50 text-red-600 text-center font-medium">\n\s*\{error\}\n\s*<\/div>\n\s*\)\}/, uiError.trim());

   fs.writeFileSync('src/pages/Clientes.tsx', page);
}

