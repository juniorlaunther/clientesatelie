const fs = require('fs');

// App.tsx
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace(
  "import Configuracoes from './pages/Configuracoes';",
  "import Configuracoes from './pages/Configuracoes';\nimport Presentes from './pages/Presentes';"
);
fs.writeFileSync('src/App.tsx', appCode);

// types.ts
let typesCode = fs.readFileSync('src/types.ts', 'utf8');
typesCode = typesCode.replace(
  "numeroEspecial: number;",
  "numeroEspecial?: number;"
);
typesCode = typesCode.replace(
  "status: 'Enviado' | 'Entregue';",
  "status?: 'Enviado' | 'Entregue';"
);
fs.writeFileSync('src/types.ts', typesCode);

// ClienteDetalhes.tsx
let cdCode = fs.readFileSync('src/pages/ClienteDetalhes.tsx', 'utf8');
cdCode = cdCode.replace(
  "id: Date.now().toString(),",
  "id: `PRES-${Date.now()}`,"
);
fs.writeFileSync('src/pages/ClienteDetalhes.tsx', cdCode);

// importService.ts
let isCode = fs.readFileSync('src/services/importService.ts', 'utf8');
isCode = isCode.replace(
  "import { doc, getDoc, getDocs, collection, setDoc, query, orderBy, writeBatch, limit, where, updateDoc } from 'firebase/firestore';",
  "import { doc, getDoc, getDocs, collection, setDoc, query, orderBy, writeBatch, limit, where, updateDoc } from 'firebase/firestore';"
);
// Wait, I see where is already in the string. Why is it failing?
