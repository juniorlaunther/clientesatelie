const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const undoUI = `    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-light text-neutral-800 tracking-tight">Importar Dados</h1>
        {status === 'idle' && lastImport && (
          <button 
            onClick={() => setShowUndoModal(true)}
            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
          >
            Desfazer última importação
          </button>
        )}
      </div>`;

code = code.replace(
  `    <div className="p-8 max-w-5xl mx-auto">\n      <h1 className="text-3xl font-light text-neutral-800 tracking-tight mb-8">Importar Dados</h1>`,
  undoUI
);

const modalUI = `
      {showUndoModal && lastImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Desfazer Importação</h3>
            <div className="bg-neutral-50 rounded-lg p-4 text-sm text-neutral-700 mb-6 space-y-2">
              <p><strong>Arquivo:</strong> {lastImport.nomeArquivo}</p>
              <p><strong>Data:</strong> {new Date(lastImport.data).toLocaleString('pt-BR')}</p>
              <p><strong>Novos clientes:</strong> {lastImport.novosClientes}</p>
              <p><strong>Novas compras:</strong> {lastImport.novasCompras}</p>
              <p><strong>Novos produtos vendidos:</strong> {lastImport.novosProdutos}</p>
            </div>
            <p className="text-sm text-neutral-500 mb-6">
              Apenas produtos e clientes criados nesta importação serão removidos. O catálogo e a numeração serão recalculados. Deseja continuar?
            </p>
            <div className="flex space-x-3">
              <button onClick={() => setShowUndoModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleUndo} disabled={undoing} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center">
                {undoing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(
  /    <\/div>\n  \);\n\}/,
  modalUI
);

fs.writeFileSync('src/pages/Importar.tsx', code);
