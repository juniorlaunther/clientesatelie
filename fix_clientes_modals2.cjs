const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const modalJsx = `
      {confirmDelete && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {confirmDelete.type === 'bulk' ? 'Excluir Selecionados' : 'Excluir Cliente'}
            </h3>
            <p className="text-neutral-500 text-sm mb-6">
              {confirmDelete.type === 'bulk' 
                ? \`Tem certeza que deseja excluir \${selectedEmails.size} cliente(s)? Esta ação apagará permanentemente o(s) cliente(s) e o histórico de compras e reajustará a numeração.\`
                : 'Tem certeza que deseja excluir este cliente? Esta ação apagará permanentemente o cliente e o histórico de compras e reajustará a numeração.'}
            </p>
            <div className="flex w-full space-x-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                disabled={bulkActionLoading || loading}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                disabled={bulkActionLoading || loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {(bulkActionLoading && confirmDelete.type === 'bulk') || (loading && confirmDelete.type === 'single') ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

s = s.replace(/    <\/div>\n  \);\n\}/, modalJsx);

fs.writeFileSync('src/pages/Clientes.tsx', s);
