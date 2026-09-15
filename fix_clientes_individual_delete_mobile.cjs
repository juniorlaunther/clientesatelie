const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

s = s.replace(
  /<\/Link>\n\s*<div className="text-xs text-neutral-500 mb-2">/g,
  `</Link>
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteCliente(c.email); }} className="text-red-400 hover:text-red-600 p-1 ml-2" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-neutral-500 mb-2">`
);

fs.writeFileSync('src/pages/Clientes.tsx', s);
