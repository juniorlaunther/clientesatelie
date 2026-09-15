const fs = require('fs');
let s = fs.readFileSync('src/pages/ClienteDetalhes.tsx', 'utf8');
s = s.replace(
  /nomeProduto: novaCompra\.produto,\n\s*codigoProduto: 'MANUAL',/g,
  "nomeProduto: novaCompra.produto,\n        codigoProduto: novaCompra.codigoProduto || 'MANUAL',"
);
fs.writeFileSync('src/pages/ClienteDetalhes.tsx', s);
