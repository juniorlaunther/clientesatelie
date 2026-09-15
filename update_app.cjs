const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import Configuracoes from './pages/Configuracoes';",
  `import Configuracoes from './pages/Configuracoes';
import Presentes from './pages/Presentes';`
);

code = code.replace(
  "<Route path=\"/listas\" element={<Listas />} />",
  `<Route path="/listas" element={<Listas />} />
              <Route path="/presentes" element={<Presentes />} />`
);

code = code.replace(
  "{ icon: LayoutGrid, label: 'Catálogo', path: '/catalogo' },",
  `{ icon: LayoutGrid, label: 'Catálogo', path: '/catalogo' },
    { icon: Gift, label: 'Presentes', path: '/presentes' },`
);

fs.writeFileSync('src/App.tsx', code);
