const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(
  "await clientService.updateCliente(email, { etiquetas: tags });",
  "await clientService.updateCliente(email as string, { etiquetas: tags });"
);

code = code.replace(
  "const cliente = clientes.find(c => c.email === email);",
  "const cliente = clientes.find(c => c.email === (email as string));"
);

code = code.replace(
  "Array.from(selectedEmails).map(email =>",
  "Array.from(selectedEmails).map((email: any) =>"
);

// Fix TS246 error for ListaSalva missing
if (!code.includes("import { ListaSalva }")) {
  code = code.replace(
    "import { listaService } from '../services/listaService';",
    "import { listaService } from '../services/listaService';\nimport { ListaSalva } from '../types';"
  );
}

fs.writeFileSync('src/pages/Clientes.tsx', code);
