const fs = require('fs');
let s = fs.readFileSync('src/lib/firebase.ts', 'utf8');

s = s.replace(
  /const projectId = import\.meta\.env\.VITE_FIREBASE_PROJECT_ID;\s*if \(projectId !== "atelie-do-ju-clientes"\) \{\s*throw new Error\(`Firebase Project ID ausente ou inválido\. Esperado 'atelie-do-ju-clientes', recebido: '\$\{projectId\}'`\);\s*\}/,
  "const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;\nif (!projectId) {\n  throw new Error('Firebase Project ID ausente nas variáveis de ambiente.');\n}"
);

s = s.replace(
  /const APP_NAME = "oficial-atelie-do-ju";/,
  "const APP_NAME = \"painel-clientes\";"
);

fs.writeFileSync('src/lib/firebase.ts', s);
