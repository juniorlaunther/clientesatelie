import fs from 'fs';

// Remove from Dashboard.tsx
let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

dashboard = dashboard.replace(/import \{ migrationService \} from '\.\.\/services\/migrationService';\n/, '');

const regexDashboardStates = /const \[migrationPreview, setMigrationPreview\][\s\S]*?setIsMigrating\(false\);\n\s*\}\n\s*\};\n/;
dashboard = dashboard.replace(regexDashboardStates, '');

const regexDashboardBtn = /\{\!migrationPreview\?\.isCompleted && \([\s\S]*?\}\)\}/;
dashboard = dashboard.replace(regexDashboardBtn, '');

fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);


// Add to Configuracoes.tsx
let settings = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

if (!settings.includes('Otimização do banco de dados')) {
  settings = settings.replace("import { useStore } from '../store';", "import { useStore } from '../store';\nimport { migrationService } from '../services/migrationService';");
  
  const states = `
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
      setMigrationLog('Otimização concluída com sucesso!');
    } catch (e: any) {
      setMigrationLog('Erro: ' + e.message);
    } finally {
      setIsMigrating(false);
    }
  };
`;
  settings = settings.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);\n" + states);

  const section = `
      {/* Otimização do banco de dados */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold mb-4">Otimização do banco de dados</h2>
        <div className="flex flex-col space-y-2 text-sm text-neutral-600 mb-4">
          <p><strong>Status:</strong> {migrationPreview?.isCompleted ? 'Concluída' : 'Pendente'}</p>
          <p><strong>Versão atual dos dados:</strong> {migrationPreview?.versaoAtual || 'Carregando...'}</p>
          <p><strong>Próxima versão:</strong> v2</p>
          {migrationPreview?.ultimaExecucao && <p><strong>Data da última execução:</strong> {new Date(migrationPreview.ultimaExecucao).toLocaleString()}</p>}
        </div>
        
        {!migrationPreview?.isCompleted ? (
           <button 
             onClick={openMigration}
             className="px-4 py-2 bg-purple-600 text-white rounded-md font-medium text-sm hover:bg-purple-700 transition-colors"
           >
             Ver prévia da atualização
           </button>
        ) : (
           <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">
             ✓ Otimização concluída
           </div>
        )}
      </div>

      {showMigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Prévia da Atualização Interna</h3>
            {migrationPreview ? (
               <div className="text-sm space-y-2 mb-4 text-neutral-700">
                 <p>Total atual de clientes: <strong>{migrationPreview.totalClientes}</strong></p>
                 <p>Total atual de compras: <strong>{migrationPreview.totalCompras}</strong></p>
                 <p>Total atual de produtos comprados: <strong>{migrationPreview.totalProdutosComprados}</strong></p>
                 <p>Total atual de produtos oficiais: <strong>{migrationPreview.totalProdutosOficiais}</strong></p>
                 <p className="mt-2 text-amber-600 font-medium">Clientes sem os novos campos de resumo: {migrationPreview.clientesSemResumo}</p>
                 <p className="text-amber-600 font-medium">Compras sem os novos campos de resumo: {migrationPreview.comprasSemResumo}</p>
                 <p className="text-amber-600 font-medium">Produtos sem os novos contadores: {migrationPreview.produtosSemResumo}</p>
                 <p className="text-amber-600 font-medium">Quantidade estimada de documentos alterados: {migrationPreview.estimatedDocs}</p>
                 
                 {migrationPreview.isCompleted && (
                    <p className="text-green-600 font-bold mt-2">A otimização já foi concluída e está bloqueada.</p>
                 )}
               </div>
            ) : (
               <p className="text-sm text-neutral-500 mb-4">{migrationLog}</p>
            )}
            
            {migrationLog && (!migrationPreview || !migrationPreview.isCompleted || migrationLog.includes('concluída')) && (
               <p className="text-xs font-mono bg-neutral-100 p-2 rounded mb-4 max-h-24 overflow-auto">{migrationLog}</p>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowMigModal(false)} className="px-4 py-2 bg-neutral-100 rounded-md text-sm hover:bg-neutral-200" disabled={isMigrating}>Fechar</button>
              {migrationPreview && !migrationPreview.isCompleted && (
                <button onClick={confirmMigration} className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700" disabled={isMigrating}>
                  {isMigrating ? 'Executando...' : 'Executar atualização interna'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
`;
  // Insert at the end of the sections
  settings = settings.replace("</div>\n    </div>\n  );\n}", section + "\n    </div>\n    </div>\n  );\n}");
  fs.writeFileSync('src/pages/Configuracoes.tsx', settings);
}

