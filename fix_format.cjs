const fs = require('fs');

let cd = fs.readFileSync('src/pages/ClienteDetalhes.tsx', 'utf8');
cd = cd.replace(
  /\{format\(p\.data, 'dd\/MM\/yyyy'\)\}/g,
  "{p.data ? format(p.data, 'dd/MM/yyyy') : '-'}"
);
cd = cd.replace(
  /\{format\(compra\.dataTransacao, 'dd\/MM\/yyyy HH:mm'\)\}/g,
  "{compra.dataTransacao ? format(compra.dataTransacao, 'dd/MM/yyyy HH:mm') : '-'}"
);
fs.writeFileSync('src/pages/ClienteDetalhes.tsx', cd);

let exp = fs.readFileSync('src/pages/Exportar.tsx', 'utf8');
exp = exp.replace(
  /format\(p\.dataTransacao, 'dd\/MM\/yyyy HH:mm:ss'\)/g,
  "p.dataTransacao ? format(p.dataTransacao, 'dd/MM/yyyy HH:mm:ss') : ''"
);
fs.writeFileSync('src/pages/Exportar.tsx', exp);

