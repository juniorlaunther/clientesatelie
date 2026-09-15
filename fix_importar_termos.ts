import fs from 'fs';
let content = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const regex = /const computeTermos = \(c: any\) => \{[\s\S]*?\}\.filter\(Boolean\);\n      \};/;

const newTermos = `const computeTermos = (c: any, prods: string[], tags: string[]) => {
        return [
          c.nome?.toLowerCase(),
          c.emailOriginal?.toLowerCase(),
          c.telefoneOriginal?.toLowerCase(),
          ...prods,
          ...tags
        ].filter(Boolean);
      };`;

content = content.replace(regex, newTermos);

content = content.replace(
   /termosBusca: computeTermos\(\{ nome: data\.nome, emailOriginal: data\.emailOriginal, telefoneOriginal: data\.telefoneOriginal \}\)/,
   `termosBusca: computeTermos({ nome: data.nome, emailOriginal: data.emailOriginal, telefoneOriginal: data.telefoneOriginal }, Array.from(prodIds), [])`
);

fs.writeFileSync('src/pages/Importar.tsx', content);
