import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const regex = /if \(filters\?\.whatsapp === 'in'\)[\s\S]*?if \(filters\?\.search && !filters\?\.produtoId && !filters\?\.tag\) \{\n\s*constraints\.push\(where\('termosBusca', 'array-contains', filters\.search\.toLowerCase\(\)\)\);\n\s*\}/;

const newQueryLogic = `
    if (filters?.whatsapp === 'in') constraints.push(where('estaNoGrupo', '==', true));
    if (filters?.whatsapp === 'out') constraints.push(where('estaNoGrupo', '==', false));
    
    if (filters?.produtoId) {
       constraints.push(where(\`produtosMap.\${filters.produtoId}\`, '==', true));
    }
    
    if (filters?.tag) {
       constraints.push(where(\`etiquetasMap.\${filters.tag}\`, '==', true));
    }

    if (filters?.search) {
      constraints.push(where('termosBusca', 'array-contains', filters.search.toLowerCase()));
    }
`;

content = content.replace(regex, newQueryLogic.trim());
fs.writeFileSync('src/services/clientService.ts', content);
