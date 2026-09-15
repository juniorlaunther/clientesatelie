const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const regex = /\{showSaveListModal && \([\s\S]*?Salvar Lista[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const replacement = `{showAddToListModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">Adicionar à Lista</h3>
            <p className="text-sm text-neutral-500 mb-4">
              {selectedEmails.size} clientes selecionados.
            </p>
            
            <div className="flex space-x-4 mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" checked={addToListMode === 'existing'} onChange={() => setAddToListMode('existing')} className="text-neutral-900 focus:ring-neutral-900" />
                <span className="text-sm text-neutral-700">Lista Existente</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" checked={addToListMode === 'new'} onChange={() => setAddToListMode('new')} className="text-neutral-900 focus:ring-neutral-900" />
                <span className="text-sm text-neutral-700">Nova Lista</span>
              </label>
            </div>

            <div className="mb-6">
              {addToListMode === 'existing' ? (
                <select 
                  value={selectedListId} 
                  onChange={e => setSelectedListId(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                >
                  {listas.length === 0 && <option value="" disabled>Nenhuma lista salva</option>}
                  {listas.map(l => (
                    <option key={l.id} value={l.id}>{l.nome} ({l.clienteIds ? l.clienteIds.length : 0} clientes)</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900"
                  placeholder="Nome da nova lista"
                />
              )}
            </div>
            <div className="flex space-x-3">
              <button onClick={() => setShowAddToListModal(false)} className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200">
                Cancelar
              </button>
              <button onClick={handleAddToList} disabled={bulkActionLoading || (addToListMode === 'new' && !newListName.trim())} className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50 flex justify-center items-center">
                {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/pages/Clientes.tsx', code);
