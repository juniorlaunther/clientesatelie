import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const countRegex = /if \(filters\?\.search\) \{\n\s*constraints\.push\(where\('termosBusca', 'array-contains', filters\.search\.toLowerCase\(\)\)\);\n\s*\}/;

const newCountLogic = `
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
`;

content = content.replace(countRegex, newCountLogic.trim());
fs.writeFileSync('src/services/clientService.ts', content);
