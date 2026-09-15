import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('produtosMap?:')) {
  content = content.replace('termosBusca?: string[];', 'termosBusca?: string[];\n  produtosMap?: Record<string, boolean>;\n  etiquetasMap?: Record<string, boolean>;');
  fs.writeFileSync('src/types.ts', content);
}
