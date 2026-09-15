import fs from 'fs';
let content = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const replacement = `
          dataUltimaCompra: maxData,
          etiquetas: [],
          estaNoGrupo: false,
          termosBusca: computeTermos({ nome: data.nome, emailOriginal: data.emailOriginal, telefoneOriginal: data.telefoneOriginal }, Array.from(prodIds), []),
          produtosMap: Array.from(prodIds).reduce((acc, id) => ({ ...acc, [id]: true }), {}),
          etiquetasMap: {}
        });`;

content = content.replace(/dataUltimaCompra: maxData,[\s\S]*?termosBusca: computeTermos.*?\)\s*\}\);/, replacement.trim());
fs.writeFileSync('src/pages/Importar.tsx', content);
