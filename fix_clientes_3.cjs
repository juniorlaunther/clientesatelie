const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(
  "clientService.getClientes(),",
  "clientService.getClientes(),\n        catalogService.getCatalog(),"
);

code = code.replace(
  "const [cls, especiais] = await Promise.all([",
  "const [cls, cat, especiais] = await Promise.all(["
);

code = code.replace(
  "setNumerosEspeciais(especiais);",
  "setNumerosEspeciais(especiais);\n      setCatalog(cat);"
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
