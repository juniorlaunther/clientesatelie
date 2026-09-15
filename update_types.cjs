const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(
  /export interface Presente \{[\s\S]*?\}/,
  `export interface Presente {
  id: string;
  numeroEspecial: number;
  descricao: string;
  data: number;
  dataEnvio?: number;
  rastreamento?: string;
  observacao?: string;
  status: 'Enviado' | 'Entregue';
}`
);
code = code.replace(
  /status: 'concluida' \| 'com_erros';/,
  `status: 'concluida' | 'com_erros' | 'desfeita';
  transactionIds?: string[];
  baseCompraIds?: string[];
  newClientEmails?: string[];
  updatedClientEmails?: string[];
  newCatalogIds?: string[];
  updatedCatalogIds?: string[];`
);
fs.writeFileSync('src/types.ts', code);
