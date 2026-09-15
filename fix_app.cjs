const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes("import Presentes from './pages/Presentes';")) {
  code = code.replace(
    "import Configuracoes from './pages/Configuracoes';",
    "import Configuracoes from './pages/Configuracoes';\nimport Presentes from './pages/Presentes';"
  );
}

fs.writeFileSync('src/App.tsx', code);
