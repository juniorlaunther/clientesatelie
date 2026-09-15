const fs = require('fs');
let code = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// 1. Add set to track selected emails
code = code.replace(
  /const \[adding, setAdding\] = useState\(false\);/,
  "const [adding, setAdding] = useState(false);\n  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());\n  const [numerosEspeciais, setNumerosEspeciais] = useState<number[]>([]);\n  const [bulkActionLoading, setBulkActionLoading] = useState(false);"
);

// 2. Load numeros_especiais
code = code.replace(
  /const cls = await clientService.getClientes\(\);/,
  "const [cls, especiais] = await Promise.all([\n        clientService.getClientes(),\n        import('../services/configService').then(m => m.configService.getNumerosEspeciais())\n      ]);\n      setNumerosEspeciais(especiais);"
);

// 3. Search logic update (numero, tags)
code = code.replace(
  /c\.numero\.toString\(\)\.includes\(s\) \|\|/,
  "c.numero.toString() === s.replace('#', '') ||\n        c.etiquetas?.some(tag => tag.toLowerCase().includes(s)) ||"
);

// 4. Bulk functions
const bulkFuncs = `
  const toggleAll = () => {
    if (selectedEmails.size === filteredClientes.length) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(filteredClientes.map(c => c.email)));
    }
  };

  const toggleSelect = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) next.delete(email);
    else next.add(email);
    setSelectedEmails(next);
  };

  const handleBulkAction = async (action: 'grupo_in' | 'grupo_out' | 'destaque_in' | 'destaque_out' | 'delete') => {
    if (selectedEmails.size === 0) return;
    
    if (action === 'delete') {
      if (!window.confirm(\`Tem certeza que deseja excluir \${selectedEmails.size} clientes? A numeração de todos os outros será ajustada.\`)) return;
    }

    setBulkActionLoading(true);
    try {
      const emailsArray = Array.from(selectedEmails);
      
      if (action === 'delete') {
        await clientService.bulkDeleteClientes(emailsArray);
      } else {
        let updateData: any = {};
        if (action === 'grupo_in') updateData.estaNoGrupo = true;
        if (action === 'grupo_out') updateData.estaNoGrupo = false;
        if (action === 'destaque_in') updateData.destaqueManual = true;
        if (action === 'destaque_out') updateData.destaqueManual = false;
        
        await clientService.bulkUpdateClientes(emailsArray, updateData);
      }
      
      setSelectedEmails(new Set());
      await loadData(); // Reload to get new data and numbering
    } catch (err: any) {
      alert('Erro na ação em massa: ' + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  };
`;
code = code.replace(/const getSortIcon = [^}]+};/, match => match + '\n' + bulkFuncs);

// 5. Checkbox icon (we can just use standard input checkbox for simplicity)

// 6. Bulk Toolbar UI
const bulkToolbar = `
      {selectedEmails.size > 0 && (
        <div className="bg-purple-50 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 mb-4 flex-shrink-0 border border-purple-100">
          <span className="text-purple-800 font-medium">{selectedEmails.size} cliente(s) selecionado(s)</span>
          <div className="flex flex-wrap gap-2">
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('grupo_in')} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Adicionar ao Grupo</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('grupo_out')} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Remover do Grupo</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('destaque_in')} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Destacar</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('destaque_out')} className="text-xs bg-white text-neutral-700 px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50">Remover Destaque</button>
            <button disabled={bulkActionLoading} onClick={() => handleBulkAction('delete')} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded border border-red-200 hover:bg-red-100 disabled:opacity-50">Excluir</button>
          </div>
        </div>
      )}
`;
code = code.replace(/<div className="bg-white rounded-b-2xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col min-h-0">/, match => bulkToolbar + '\n      ' + match);

// 7. Checkboxes in table
code = code.replace(
  /<tr>\s*<th([^>]+)>\s*Nº {getSortIcon\('numero'\)}/,
  `<tr>\n                  <th className="px-6 py-4 w-10">\n                    <input type="checkbox" checked={selectedEmails.size > 0 && selectedEmails.size === filteredClientes.length} onChange={toggleAll} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" />\n                  </th>\n                  <th$1>\n                    Nº {getSortIcon('numero')}`
);

// 8. Row modifications
code = code.replace(
  /<tr key={c.email} className="hover:bg-neutral-50\/50 transition-colors">/g,
  `<tr key={c.email} className="hover:bg-neutral-50/50 transition-colors">\n                    <td className="px-6 py-4 w-10">\n                      <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleSelect(c.email)} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" />\n                    </td>`
);

// 9. Destaque Visual (Special number styling)
code = code.replace(
  /<span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-1 rounded text-xs font-semibold">/g,
  `<span className={\`font-mono px-2 py-1 rounded text-xs font-semibold \${(c.destaqueManual || numerosEspeciais.includes(c.numero)) ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700'}\`}>`
);

code = code.replace(
  /<span className="font-mono bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded text-xs font-semibold mr-2">/g,
  `<span className={\`font-mono px-2 py-0.5 rounded text-xs font-semibold mr-2 \${(c.destaqueManual || numerosEspeciais.includes(c.numero)) ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-700'}\`}>`
);

// 10. Clickable name
code = code.replace(
  /<div className="font-medium text-neutral-900 truncate max-w-\[200px\]">{c\.nome}<\/div>/g,
  `<Link to={\`/clientes/\${encodeURIComponent(c.email)}\`} className="font-medium text-neutral-900 hover:text-purple-600 transition-colors truncate max-w-[200px] block">{c.nome}</Link>`
);

// Remove duplicate `export default function Clientes() {` if added incorrectly, wait I used string replace, should be fine.

fs.writeFileSync('src/pages/Clientes.tsx', code);
