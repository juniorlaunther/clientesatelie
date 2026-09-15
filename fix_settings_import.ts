import fs from 'fs';
let settings = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

if (!settings.includes("import { migrationService }")) {
  settings = settings.replace(
    "import { configService } from '../services/configService';",
    "import { configService } from '../services/configService';\nimport { migrationService } from '../services/migrationService';"
  );
  fs.writeFileSync('src/pages/Configuracoes.tsx', settings);
}
