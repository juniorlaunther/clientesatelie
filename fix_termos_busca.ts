import fs from 'fs';
let content = fs.readFileSync('src/services/clientService.ts', 'utf8');

const regex = /const termos = \[\s*cData\.nome\?\.toLowerCase\(\),\s*cData\.emailOriginal\?\.toLowerCase\(\),\s*cData\.telefoneOriginal\?\.toLowerCase\(\),\s*\.\.\.produtosCompradosIds\s*\]\.filter\(Boolean\);/;

const newTermos = `const termos = [
      cData.nome?.toLowerCase(),
      cData.emailOriginal?.toLowerCase(),
      cData.telefoneOriginal?.toLowerCase(),
      ...produtosCompradosIds,
      ...(cData.etiquetas || [])
    ].filter(Boolean);`;

content = content.replace(regex, newTermos);
fs.writeFileSync('src/services/clientService.ts', content);
