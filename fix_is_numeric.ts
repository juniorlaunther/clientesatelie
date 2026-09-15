import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

content = content.replace(
  "const hasEqualityFilter = filters?.whatsapp === 'in' || filters?.whatsapp === 'out';",
  "const hasEqualityFilter = filters?.whatsapp === 'in' || filters?.whatsapp === 'out' || isNumericSearch;"
);

fs.writeFileSync('src/services/clientService.ts', content);
