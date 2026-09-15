import * as fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf-8');
content = content.replace(
  'nomeNormalizado: string;',
  'nomeNormalizado: string;\n  nomesAlternativos?: string[];'
);
fs.writeFileSync('src/types.ts', content);
