const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// Add state for confirmBulkDelete
code = code.replace(
  /const \[bulkActionLoading, setBulkActionLoading\] = useState\(false\);/,
  "const [bulkActionLoading, setBulkActionLoading] = useState(false);\n  const [showConfirmBulkDelete, setShowConfirmBulkDelete] = useState(false);"
);

// Modify handleBulkAction
code = code.replace(
  /if \(action === 'delete'\) \{\s*if \(\!window\.confirm\([^)]+\)\) return;\s*\}/,
  "if (action === 'delete') {\n      setShowConfirmBulkDelete(true);\n      return;\n    }"
);

// We also need a new function for confirming bulk delete
const confirmDeleteFunc = `
  const executeBulkDelete = async () => {
    setBulkActionLoading(true);
    setShowConfirmBulkDelete(false);
    try {
      const emailsArray = Array.from(selectedEmails) as string[];
      await clientService.bulkDeleteClientes(emailsArray);
      setSelectedEmails(new Set());
      await loadData();
    } catch (err: any) {
      alert('Erro na exclusão em massa: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };
`;

code = code.replace(/const handleBulkAction = async/, match => confirmDeleteFunc + '\n  ' + match);

// And we need to add the modal JSX
const modalJSX = `
      {showConfirmBulkDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Excluir {selectedEmails.size} Clientes
              </h3>
              <p className="text-neutral-500 text-sm mb-6">
                Tem certeza que deseja excluir os clientes selecionados? Esta ação é irreversível e a numeração de todos os outros será reajustada para não deixar buracos na sequência.
              </p>
              
              <div className="flex w-full space-x-3">
                <button 
                  onClick={() => setShowConfirmBulkDelete(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeBulkDelete}
                  disabled={bulkActionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {bulkActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{showAddModal && \(/, match => modalJSX + '\n      ' + match);

fs.writeFileSync('src/pages/Clientes.tsx', code);
