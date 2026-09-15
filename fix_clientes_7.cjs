const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const modals = `
      {showSaveListModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Salvar como Lista</h3>
            <p className="text-sm text-neutral-500 mb-4">
              Isto criará uma lista dinâmica baseada nos filtros atuais.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da Lista</label>
              <input
                type="text"
                value={listName}
                onChange={e => setListName(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                placeholder="Ex: Compradores do Manual"
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowSaveListModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleSaveList} disabled={!listName.trim()} className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50">
                Salvar Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkTagModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              {bulkTagAction === 'add' ? 'Adicionar Etiqueta em Massa' : 'Remover Etiqueta em Massa'}
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              {selectedEmails.size} clientes selecionados.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nome da Etiqueta</label>
              <input
                type="text"
                value={bulkTagText}
                onChange={e => setBulkTagText(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                placeholder="Ex: VIP"
              />
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowBulkTagModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleBulkTag} disabled={!bulkTagText.trim() || bulkActionLoading} className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center">
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

code = code.replace(
  /    <\/div>\s*\);\s*\}\s*$/,
  modals
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
