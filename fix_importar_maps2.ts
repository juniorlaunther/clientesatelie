import fs from 'fs';
let content = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const regex = /updatedClientsToWrite\.push\(\{[\s\S]*?quantidadeProdutos: prodIds\.size\n\s*\}\);/;

const newLogic = `
         const pArray = Array.from(prodIds);
         updatedClientsToWrite.push({
           ...existing,
           quantidadeCompras: qtdCompras,
           dataUltimaCompra: maxData,
           produtosCompradosIds: pArray,
           produtosMap: pArray.reduce((acc, id) => ({ ...acc, [id]: true }), {}),
           termosBusca: computeTermos(existing, pArray, existing.etiquetas || []),
           quantidadeProdutos: pArray.length
         });`;

content = content.replace(regex, newLogic.trim());
fs.writeFileSync('src/pages/Importar.tsx', content);
