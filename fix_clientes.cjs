const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// 1. Add imports for listaService and Listas
code = code.replace(
  "import { clientService } from '../services/clientService';",
  "import { clientService } from '../services/clientService';\nimport { listaService } from '../services/listaService';\nimport { ListaSalva } from '../types';"
);

// 2. Add state for lists
code = code.replace(
  "const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState(false);",
  "const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState(false);\n  const [listas, setListas] = useState<ListaSalva[]>([]);\n  const [showAddToListModal, setShowAddToListModal] = useState(false);\n  const [addToListMode, setAddToListMode] = useState<'existing'|'new'>('existing');\n  const [selectedListId, setSelectedListId] = useState('');\n  const [newListName, setNewListName] = useState('');"
);

// 3. Load lists in loadData
code = code.replace(
  /const \[clientesList, catalog\] = await Promise\.all\(\[\s*clientService\.getClientes\(\),\s*catalogService\.getCatalog\(\)\s*\]\);/,
  `const [clientesList, catalog, allListas] = await Promise.all([
        clientService.getClientes(),
        catalogService.getCatalog(),
        listaService.getListas()
      ]);
      setListas(allListas);
      if (allListas.length > 0) setSelectedListId(allListas[0].id);`
);

// 4. Update filtering logic to support listaId
code = code.replace(
  "const groupParam = searchParams.get('grupo');",
  "const groupParam = searchParams.get('grupo');\n    const listaParam = searchParams.get('listaId');"
);
code = code.replace(
  "if (tagParam) {",
  `if (listaParam) {
      const targetList = listas.find(l => l.id === listaParam);
      if (targetList && targetList.clienteIds) {
        const idSet = new Set(targetList.clienteIds);
        filtered = filtered.filter(c => idSet.has(c.email));
      }
    }
    
    if (tagParam) {`
);

// 5. Update Bulk Actions to be simpler
code = code.replace(
  /const handleBulkGroup = async \(add: boolean\) => \{[\s\S]*?finally \{[\s\S]*?\}[\s\S]*?\};/,
  `const handleToggleWhatsApp = async () => {
    setBulkActionLoading(true);
    try {
      const selected = clientes.filter(c => selectedEmails.has(c.email));
      const allInGroup = selected.every(c => c.estaNoGrupo);
      const newValue = !allInGroup;
      
      const promises = Array.from(selectedEmails).map(email => 
        clientService.updateCliente(email, { estaNoGrupo: newValue })
      );
      await Promise.all(promises);
      await loadData();
      setSelectedEmails(new Set());
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };`
);

// Remove the old Salvar Lista function
code = code.replace(
  /const handleSaveList = async \(\) => \{[\s\S]*?finally \{[\s\S]*?\}[\s\S]*?\};/,
  `const handleAddToList = async () => {
    setBulkActionLoading(true);
    try {
      if (addToListMode === 'existing') {
        if (!selectedListId) return alert('Selecione uma lista');
        await listaService.addClientesToLista(selectedListId, Array.from(selectedEmails));
      } else {
        if (!newListName.trim()) return alert('Digite um nome para a lista');
        const novaLista: ListaSalva = {
          id: Date.now().toString(),
          nome: newListName.trim(),
          clienteIds: Array.from(selectedEmails),
          criadoEm: Date.now()
        };
        await listaService.createLista(novaLista);
      }
      setShowAddToListModal(false);
      setNewListName('');
      setSelectedEmails(new Set());
      await loadData();
      alert('Clientes adicionados à lista com sucesso!');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };`
);

// Add the Toggle WhatsApp and Add to list buttons to the action bar, and remove old action bar stuff
code = code.replace(
  /<div className="flex items-center space-x-2">[\s\S]*?<span>Excluir<\/span>[\s\S]*?<\/button>[\s\S]*?<\/div>/,
  `<div className="flex items-center space-x-2">
                <button onClick={handleToggleWhatsApp} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-sm font-medium transition-colors flex items-center">
                  <MessageCircle className="w-4 h-4 mr-1.5" /> Alternar Grupo WP
                </button>
                <div className="relative group">
                  <button className="px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded text-sm font-medium transition-colors flex items-center">
                    <Tag className="w-4 h-4 mr-1.5" /> Etiquetas
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
                    <button onClick={() => { setBulkTagAction('add'); setShowBulkTagModal(true); }} className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Adicionar...</button>
                    <button onClick={() => { setBulkTagAction('remove'); setShowBulkTagModal(true); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Remover...</button>
                  </div>
                </div>
                <button onClick={() => setShowAddToListModal(true)} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium transition-colors flex items-center">
                  <List className="w-4 h-4 mr-1.5" /> Salvar em Lista
                </button>
                <button onClick={handleBulkExport} className="px-3 py-1.5 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 rounded text-sm font-medium transition-colors flex items-center">
                  <Download className="w-4 h-4 mr-1.5" /> Exportar
                </button>
                <button onClick={() => setShowConfirmBulkDelete(true)} className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm font-medium transition-colors flex items-center">
                  <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
                </button>
              </div>`
);

// Remove the old Salvar Lista top button
code = code.replace(
  /<button onClick=\{\(\) => setShowSaveListModal\(true\)\} className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shrink-0">[\s\S]*?<span>Salvar Lista<\/span>[\s\S]*?<\/button>/,
  ""
);

// Add "Select All" checkbox
code = code.replace(
  /<th className="px-4 py-3 w-4"><\/th>/,
  `<th className="px-4 py-3 w-4">
    <input 
      type="checkbox" 
      className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500"
      checked={filteredClientes.length > 0 && selectedEmails.size === filteredClientes.length}
      onChange={e => {
        if (e.target.checked) setSelectedEmails(new Set(filteredClientes.map(c => c.email)));
        else setSelectedEmails(new Set());
      }}
    />
  </th>`
);

// Replace Save List Modal with Add to List Modal
code = code.replace(
  /\{showSaveListModal && \([\s\S]*?\}\)/,
  `{showAddToListModal && (
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
      )}`
);


fs.writeFileSync('src/pages/Clientes.tsx', code);
