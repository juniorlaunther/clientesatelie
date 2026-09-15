const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(
  "if (whatsappFilter !== 'all') {",
  `if (produtoFilter) {
      const cat = catalog.find(c => c.id === produtoFilter);
      if (cat) {
        result = result.filter(c => c._produtos.some(p => cat.codigosProduto.includes(p.codigoProduto)));
      }
    }
    
    if (whatsappFilter !== 'all') {`
);

code = code.replace(
  "[search, whatsappFilter, sortField, sortDesc, clientes]);",
  "[search, whatsappFilter, produtoFilter, sortField, sortDesc, clientes, catalog]);"
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
