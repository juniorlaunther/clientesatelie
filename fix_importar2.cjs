const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(
  "importService.getMaxClientNumber()\\n      ]);",
  "importService.getMaxClientNumber(),\\n        catalogService.getCatalog()\\n      ]);"
);
// just in case:
code = code.replace(
  /importService\.getMaxClientNumber\(\)\s*\]\);/,
  "importService.getMaxClientNumber(),\n        catalogService.getCatalog()\n      ]);"
);

fs.writeFileSync('src/pages/Importar.tsx', code);
