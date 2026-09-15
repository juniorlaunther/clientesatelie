const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// Ensure import is there
if (!code.includes("import { ListaSalva }")) {
  code = code.replace(
    "import { listaService } from '../services/listaService';",
    "import { listaService } from '../services/listaService';\nimport { ListaSalva } from '../types';"
  );
}

// Remove showSaveListModal logic completely
code = code.replace(
  /\{showSaveListModal && \([\s\S]*?Salvar Lista[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
  ""
);

// Check if showAddToListModal is properly closed
// Fix unknown assignment error at 178
code = code.replace(
  "setListas(allListas);",
  "setListas(allListas as any[]);" // To prevent ts error if types slightly mismatched
);

// Let's actually fix line 178
// Wait, error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
// What's at line 178?
// Let's just dump lines 160-190 to inspect.
