const fs = require('fs');
let code = fs.readFileSync('src/pages/ClienteDetalhes.tsx', 'utf8');

const statsCard = `
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Total Comprado (Bruto)</p>
              <p className="text-2xl font-bold text-neutral-900">
                R$ {produtos.reduce((sum, p) => sum + (p.valorTotal || 0), 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-5">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Deixou Líquido</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {produtos.reduce((sum, p) => sum + (p.faturamentoLiquido || 0), 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
`;

code = code.replace(/<div className="lg:col-span-2 space-y-6">/, match => match + '\n' + statsCard);

fs.writeFileSync('src/pages/ClienteDetalhes.tsx', code);
