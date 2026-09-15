import fs from 'fs';

// 1. Fix types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/\s*produtosMap\?: Record<string, boolean>;/, '');
types = types.replace(/\s*etiquetasMap\?: Record<string, boolean>;/, '');
fs.writeFileSync('src/types.ts', types);

// 2. Fix clientService.ts
let clientSvc = fs.readFileSync('src/services/clientService.ts', 'utf8');

// Inside recalcularResumoCliente
const regexProdMap = /const produtosMap: Record<string, boolean> = \{\};\n\s*produtosCompradosIds\.forEach\(id => produtosMap\[id\] = true\);\n/;
clientSvc = clientSvc.replace(regexProdMap, '');

const regexEtiqMap = /const etiquetasMap: Record<string, boolean> = \{\};\n\s*etiquetas\.forEach\(\(t: string\) => etiquetasMap\[t\] = true\);\n/;
clientSvc = clientSvc.replace(regexEtiqMap, '');

clientSvc = clientSvc.replace(/\s*produtosMap,/, '');
clientSvc = clientSvc.replace(/\s*etiquetasMap,/, '');

// Fix getClientesCount constraints
clientSvc = clientSvc.replace(
  /if \(filters\?\.produtoId\) \{\n\s*constraints\.push\(where\(`produtosMap\.\$\{filters\.produtoId\}`,\s*'==',\s*true\)\);\n\s*\}/,
  "if (filters?.produtoId) {\n       constraints.push(where('produtosCompradosIds', 'array-contains', filters.produtoId));\n    }"
);

// We cannot do two array-contains in getClientesCount either.
// We must mirror what's in getClientesPaginated:
// getClientesCount:
/*
    if (filters?.tag) {
       constraints.push(where(`etiquetasMap.${filters.tag}`, '==', true));
    }
*/
const regexCountTag = /if \(filters\?\.tag\) \{\n\s*constraints\.push\(where\(`etiquetasMap\.\$\{filters\.tag\}`,\s*'==',\s*true\)\);\n\s*\}/;
clientSvc = clientSvc.replace(regexCountTag, `if (filters?.tag && !filters?.produtoId && !filters?.search) {
       constraints.push(where('etiquetas', 'array-contains', filters.tag));
    }`);

fs.writeFileSync('src/services/clientService.ts', clientSvc);

// 3. Fix Importar.tsx
let impSvc = fs.readFileSync('src/pages/Importar.tsx', 'utf8');
impSvc = impSvc.replace(/\s*produtosMap:\s*Array\.from\(prodIds\)\.reduce[^,]*,/, '');
impSvc = impSvc.replace(/\s*etiquetasMap:\s*\{\}/, '');
impSvc = impSvc.replace(/\s*produtosMap:\s*pArray\.reduce[^,]*,/, '');

fs.writeFileSync('src/pages/Importar.tsx', impSvc);
