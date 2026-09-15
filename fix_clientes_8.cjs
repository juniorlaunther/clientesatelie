const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

code = code.replace(
  /<button onClick=\{\(\) => setShowSaveListModal\(true\)\}[\s\S]*?<span>Novo Cliente<\/span>\s*<\/button>/,
  `<div className="flex items-center space-x-3">
          <button onClick={() => setShowSaveListModal(true)} className="bg-white border border-neutral-200 text-neutral-700 px-5 py-2.5 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2">
            <span>Salvar como Lista</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
            <Plus size={20} />
            <span>Novo Cliente</span>
          </button>
        </div>`
);

fs.writeFileSync('src/pages/Clientes.tsx', code);
