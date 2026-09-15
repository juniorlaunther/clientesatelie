const fs = require('fs');
let s = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

s = s.replace(
  /export default function Configuracoes\(\) \{/,
  "import { catalogService } from '../services/catalogService';\nimport { statsService } from '../services/statsService';\nimport { clientService } from '../services/clientService';\nexport default function Configuracoes() {"
);

const fnStr = `
  const handleReparar = async () => {
    setSaving(true);
    try {
      // 1. Recalcula todos os clientes (muito pesado, mas repara bugs passados)
      await clientService.recalcularNumeracao();
      
      // 2. Recalcula todos os produtos do catalogo
      const cat = await catalogService.getCatalog();
      for(const p of cat) {
         await catalogService.recalcularResumoProduto(p.id);
      }
      
      // 3. Atualiza os totais
      await statsService.atualizarEstatisticasGerais();
      alert('Banco de dados reparado e re-sincronizado com sucesso!');
    } catch(err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };
`;

s = s.replace(
  /const loadData = async \(\) => \{/,
  fnStr + "\n  const loadData = async () => {"
);

const btnStr = `
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8">
          <h2 className="text-xl font-medium text-neutral-900 mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-3 text-red-500" />
            Manutenção do Sistema
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Se os dados do Painel (clientes, produtos ou unidades vendidas) estiverem inconsistentes devido a erros passados, você pode forçar um recálculo geral de toda a base de dados. Este processo pode demorar alguns minutos.
          </p>
          <button
            onClick={handleReparar}
            disabled={saving}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Reparar Banco de Dados'}
          </button>
        </div>
      </div>
`;

s = s.replace(
  /<\/div>\s*<\/div>\s*\);\s*\}/,
  btnStr + "\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/Configuracoes.tsx', s);
