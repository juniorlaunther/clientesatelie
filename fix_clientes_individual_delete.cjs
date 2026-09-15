const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

s = s.replace(
  /import \{ Loader2, Search, Plus, Filter, MessageCircle, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingBag, Package \} from 'lucide-react';/,
  "import { Loader2, Search, Plus, Filter, MessageCircle, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingBag, Package, Trash2 } from 'lucide-react';"
);

// We need a handleDeleteCliente function
const handleDeleteCliente = `  const handleDeleteCliente = async (email: string) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente este cliente e seu histórico de compras?')) {
      return;
    }
    setLoading(true);
    try {
      await clientService.bulkDeleteClientes([email]);
      // Remove local and reset
      loadPage(currentPage);
    } catch (e: any) {
      alert('Erro: ' + e.message);
      setLoading(false);
    }
  };

  const handleBulkAction = async`;

s = s.replace(/  const handleBulkAction = async/, handleDeleteCliente);

// Desktop
s = s.replace(
  /<td className="px-6 py-4 text-right">\n\s*<Link to=\{\`\/clientes\/\$\{c\.email\}\`\} className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1\.5 rounded-lg transition-colors">\n\s*Abrir\n\s*<\/Link>\n\s*<\/td>/,
  `<td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                        <Link to={\`/clientes/\${c.email}\`} className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                          Abrir
                        </Link>
                        <button onClick={() => handleDeleteCliente(c.email)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>`
);
s = s.replace(
  /<td className="px-6 py-4 text-right">\n\s*<Link to=\{\`\/clientes\/\$\{c\.email\}\`\} className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1\.5 rounded-lg transition-colors">\n\s*Abrir\n\s*<\/Link>\n\s*<\/td>/g,
  `<td className="px-6 py-4 text-right flex items-center justify-end space-x-2">
                        <Link to={\`/clientes/\${c.email}\`} className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                          Abrir
                        </Link>
                        <button onClick={() => handleDeleteCliente(c.email)} className="text-red-500 hover:text-red-700 bg-red-50 p-1.5 rounded-lg transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>`
);

// Mobile
s = s.replace(
  /<\/Link>\n\s*<\/div>\n\s*<div className="text-xs text-neutral-500 mb-2">/g,
  `</Link>
                        <button onClick={() => handleDeleteCliente(c.email)} className="text-red-400 hover:text-red-600 p-1" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-neutral-500 mb-2">`
);

fs.writeFileSync('src/pages/Clientes.tsx', s);
