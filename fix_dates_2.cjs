const fs = require('fs');

let compras = fs.readFileSync('src/pages/Compras.tsx', 'utf8');
compras = compras.replace(
  /\{format\(new Date\(c\.dataTransacao\), 'dd\/MM\/yyyy HH:mm'\)\}/g,
  "{c.dataTransacao ? format(new Date(c.dataTransacao), 'dd/MM/yyyy HH:mm') : '-'}"
);
fs.writeFileSync('src/pages/Compras.tsx', compras);

let prodDet = fs.readFileSync('src/pages/ProdutoDetalhes.tsx', 'utf8');
prodDet = prodDet.replace(
  /new Date\(c\.dataPrimeiraCompra\)\.toLocaleDateString\('pt-BR'\)/g,
  "c.dataPrimeiraCompra ? new Date(c.dataPrimeiraCompra).toLocaleDateString('pt-BR') : '-'"
);
prodDet = prodDet.replace(
  /new Date\(c\.dataPrimeiraCompraProduto\)\.toLocaleDateString\('pt-BR'\)/g,
  "c.dataPrimeiraCompraProduto ? new Date(c.dataPrimeiraCompraProduto).toLocaleDateString('pt-BR') : '-'"
);
prodDet = prodDet.replace(
  /new Date\(c\.dataUltimaCompraProduto\)\.toLocaleDateString\('pt-BR'\)/g,
  "c.dataUltimaCompraProduto ? new Date(c.dataUltimaCompraProduto).toLocaleDateString('pt-BR') : '-'"
);
fs.writeFileSync('src/pages/ProdutoDetalhes.tsx', prodDet);

let exportar = fs.readFileSync('src/pages/Exportar.tsx', 'utf8');
exportar = exportar.replace(
  /const start = new Date\(startDate \+ 'T00:00:00'\)\.getTime\(\);/,
  "const start = startDate ? new Date(startDate + 'T00:00:00').getTime() : 0;"
);
exportar = exportar.replace(
  /const end = new Date\(endDate \+ 'T23:59:59'\)\.getTime\(\);/,
  "const end = endDate ? new Date(endDate + 'T23:59:59').getTime() : 0;"
);
fs.writeFileSync('src/pages/Exportar.tsx', exportar);

