const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

// Ensure we have useRef imported
if (!s.includes('useRef')) {
  s = s.replace(/import React, \{ useState, useEffect \} from 'react';/, "import React, { useState, useEffect, useRef } from 'react';");
  // Just in case it's imported differently
  s = s.replace(/import \{ useState, useEffect \} from "react";/, "import { useState, useEffect, useRef } from \"react\";");
}

// Add touch ref logic right after selectedEmails state (around line 47 or inside the component)
const touchLogic = `
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (email: string) => {
    touchTimer.current = setTimeout(() => {
      toggleSelect(email);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const isSelectionMode = selectedEmails.size > 0;
`;

// Insert the logic before the loadPage function
s = s.replace(/const loadPage = async/, touchLogic + "\n  const loadPage = async");

// Now rewrite the table rendering
const oldTableStart = '<table className="w-full text-sm text-left whitespace-nowrap">';
const oldTableEnd = '</table>';

const startIndex = s.indexOf(oldTableStart);
const endIndex = s.indexOf(oldTableEnd) + oldTableEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newRender = `
            <>
            {/* Desktop View */}
            <div className="hidden md:block">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-neutral-500 uppercase bg-transparent border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-4 w-10" title="Selecionar os clientes desta página">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedEmails.size === clientes.length && clientes.length > 0} onChange={toggleAll} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" />
                      </div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('numero')}>
                      <div className="flex items-center"># <SortIcon field="numero" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('nome')}>
                      <div className="flex items-center">Cliente <SortIcon field="nome" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('totalCompras')}>
                      <div className="flex items-center">Total Compras <SortIcon field="totalCompras" /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('totalProdutos')}>
                      <div className="flex items-center">Total Produtos <SortIcon field="totalProdutos" /></div>
                    </th>
                    <th className="px-6 py-4">WhatsApp</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientes.map(c => (
                    <tr key={c.email} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4 w-10">
                        <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleSelect(c.email)} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 font-medium text-neutral-900">{c.numero}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900 flex items-center space-x-2">
                          <Link to={\`/clientes/\${c.email}\`} className="text-purple-700 hover:text-purple-900 font-semibold">{c.nome}</Link>
                          {c.destaqueManual && <span className="flex w-2 h-2 rounded-full bg-amber-400" title="Cliente Destacado"></span>}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5">{c.emailOriginal}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
                          {c.quantidadeCompras || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                          {c.quantidadeProdutos || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.estaNoGrupo ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <MessageCircle className="w-3 h-3 mr-1" /> No Grupo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Não
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={\`/clientes/\${c.email}\`} className="text-indigo-600 hover:text-indigo-900 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden flex flex-col divide-y divide-neutral-100">
              {isSelectionMode && (
                <div className="px-4 py-3 bg-neutral-50 flex items-center justify-between border-b border-neutral-200">
                   <div className="flex items-center gap-2">
                     <input type="checkbox" checked={selectedEmails.size === clientes.length && clientes.length > 0} onChange={toggleAll} className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer" />
                     <span className="text-sm font-medium text-neutral-700">Selecionar Todos</span>
                   </div>
                </div>
              )}
              {clientes.map(c => (
                <div 
                  key={c.email} 
                  className={\`flex items-center py-4 px-2 \${selectedEmails.has(c.email) ? 'bg-purple-50/50' : 'active:bg-neutral-50'}\`}
                >
                  {isSelectionMode && (
                    <div className="pl-2 pr-3 flex-shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedEmails.has(c.email)} 
                        onChange={() => toggleSelect(c.email)} 
                        className="rounded border-neutral-300 text-purple-600 focus:ring-purple-500 w-5 h-5 cursor-pointer" 
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-col pl-2">
                    <div className="flex justify-between items-start mb-1">
                      <Link 
                        to={\`/clientes/\${c.email}\`} 
                        className="font-medium text-purple-700 truncate block"
                        onTouchStart={() => handleTouchStart(c.email)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onMouseDown={() => handleTouchStart(c.email)}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                      >
                        {c.numero}. {c.nome}
                        {c.destaqueManual && <span className="inline-block ml-2 w-2 h-2 rounded-full bg-amber-400" title="Cliente Destacado"></span>}
                      </Link>
                      <div className="flex-shrink-0 ml-2">
                         {c.estaNoGrupo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                            <MessageCircle className="w-3 h-3 mr-1" /> Grupo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200">
                            Fora
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-neutral-500 truncate mb-2">
                      {c.emailOriginal}
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-neutral-600">
                      <div className="flex items-center">
                        <ShoppingBag className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                        <span className="font-medium text-neutral-800 mr-1">{c.quantidadeCompras || 0}</span> compras
                      </div>
                      <div className="flex items-center">
                        <Package className="w-3.5 h-3.5 mr-1 text-neutral-400" />
                        <span className="font-medium text-neutral-800 mr-1">{c.quantidadeProdutos || 0}</span> unid.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </>
`;
  
  s = s.substring(0, startIndex) + newRender + s.substring(endIndex);
}

fs.writeFileSync('src/pages/Clientes.tsx', s);
