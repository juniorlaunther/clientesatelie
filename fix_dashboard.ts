import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /const runMigration[\s\S]*?alert\('Migration complete!'\);\n\s*\}\n\s*\};/;

const newLogic = `
  const [migrationPreview, setMigrationPreview] = React.useState<any>(null);
  const [migrationLog, setMigrationLog] = React.useState<string>('');
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [showMigModal, setShowMigModal] = React.useState(false);

  const openMigration = async () => {
    setShowMigModal(true);
    setMigrationLog('Carregando prévia...');
    try {
       const preview = await migrationService.getMigrationPreview();
       setMigrationPreview(preview);
       setMigrationLog('');
    } catch (e: any) {
       setMigrationLog('Erro ao carregar prévia: ' + e.message);
    }
  };

  const confirmMigration = async () => {
    if (!migrationPreview || migrationPreview.isCompleted) return;
    setIsMigrating(true);
    try {
      await migrationService.runSummaryMigration((msg) => setMigrationLog(msg));
      const post = await migrationService.getMigrationPreview();
      setMigrationPreview(post);
      setMigrationLog('Migração finalizada. Atualize a página se desejar ver os números absolutos atualizados.');
    } catch (e: any) {
      setMigrationLog('Erro: ' + e.message);
    } finally {
      setIsMigrating(false);
    }
  };
`;

content = content.replace(regex, newLogic);

// Then replace the button:
const btnRegex = /<button onClick=\{runMigration\} className="text-xs text-neutral-400 underline">Run DB Migration<\/button>/;
const newBtn = `
  {!migrationPreview?.isCompleted && (
    <button onClick={openMigration} className="text-xs px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200">Migração Pendente v2 (Clique aqui)</button>
  )}
  {showMigModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">Prévia da Migração de Dados</h3>
        {migrationPreview ? (
           <div className="text-sm space-y-2 mb-4 text-neutral-700">
             <p>Clientes a serem analisados: {migrationPreview.totalClientes}</p>
             <p>Clientes sem resumo (V1): {migrationPreview.clientesSemResumo}</p>
             <p>Compras totais: {migrationPreview.totalCompras}</p>
             <p>Produtos comprados totais: {migrationPreview.totalProdutos}</p>
             <p>Versão atual: {migrationPreview.versaoAtual}</p>
             <p>Versão futura: {migrationPreview.versaoFutura}</p>
             {migrationPreview.isCompleted && (
                <p className="text-green-600 font-bold mt-2">Migração já foi concluída e está bloqueada para novas execuções.</p>
             )}
           </div>
        ) : (
           <p className="text-sm text-neutral-500 mb-4">{migrationLog}</p>
        )}
        
        {migrationLog && migrationPreview && !migrationPreview.isCompleted && (
           <p className="text-xs font-mono bg-neutral-100 p-2 rounded mb-4 max-h-24 overflow-auto">{migrationLog}</p>
        )}

        <div className="flex justify-end gap-3">
          <button onClick={() => setShowMigModal(false)} className="px-4 py-2 bg-neutral-100 rounded-md text-sm hover:bg-neutral-200" disabled={isMigrating}>Fechar</button>
          {migrationPreview && !migrationPreview.isCompleted && (
            <button onClick={confirmMigration} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700" disabled={isMigrating}>
              {isMigrating ? 'Executando...' : 'Confirmar e Executar'}
            </button>
          )}
        </div>
      </div>
    </div>
  )}
`;

content = content.replace(btnRegex, newBtn);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
