import fs from 'fs';
let content = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

// Remove import
content = content.replace("import { migrationService } from '../services/migrationService';\n", "");

// Remove states and functions
const statesRegex = /const \[migrationPreview, setMigrationPreview\] = React\.useState<any>\(null\);[\s\S]*?setIsMigrating\(false\);\n\s*\}\n\s*\};\n/;
content = content.replace(statesRegex, "");

// Remove JSX
const jsxRegex = /\{\/\* Otimização do banco de dados \*\/\}[\s\S]*?<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*\)\;\n\}/;
const endReplacement = "</div>\n    </div>\n  );\n}";
content = content.replace(jsxRegex, endReplacement);

fs.writeFileSync('src/pages/Configuracoes.tsx', content);
