const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

code = code.replace(/import \{ importService \}\r?\n?import \{ clientService \} from '\.\.\/services\/importService';/, "import { importService } from '../services/importService';\nimport { clientService } from '../services/clientService';");

fs.writeFileSync('src/pages/Importar.tsx', code);
