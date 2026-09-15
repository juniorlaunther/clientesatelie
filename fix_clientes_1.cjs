const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(
  "import { Link, useNavigate } from 'react-router-dom';",
  "import { Link, useNavigate, useSearchParams } from 'react-router-dom';\nimport { catalogService } from '../services/catalogService';\nimport { ProdutoCatalogo } from '../types';\nimport { listaService } from '../services/listaService';\nimport { Tag, Download } from 'lucide-react';"
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
