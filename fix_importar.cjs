const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(
  "import { clientService }\\nimport { catalogService }\\nimport { ProdutoCatalogo } from '../services/clientService';",
  "import { clientService } from '../services/clientService';\nimport { catalogService } from '../services/catalogService';\nimport { ProdutoCatalogo } from '../types';"
);

fs.writeFileSync('src/pages/Importar.tsx', code);
