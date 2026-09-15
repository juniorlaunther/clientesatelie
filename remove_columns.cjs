const fs = require('fs');
let s = fs.readFileSync('src/pages/Clientes.tsx', 'utf8');

const thToRemove = `                  <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('primeiraCompra')}>
                    <div className="flex items-center">Primeira Compra <SortIcon field="primeiraCompra" /></div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer group" onClick={() => toggleSort('ultimaCompra')}>
                    <div className="flex items-center">Última Compra <SortIcon field="ultimaCompra" /></div>
                  </th>\n`;

const tdToRemove = `                    <td className="px-6 py-4 text-neutral-500">
                      {c.dataPrimeiraCompra ? format(new Date(c.dataPrimeiraCompra), "dd/MM/yyyy") : "-"}
                      <div className="text-xs text-neutral-400 mt-0.5">{c.codigoPrimeiraCompra}</div>
                    </td>
                    <td className="px-6 py-4 text-neutral-500">
                      {c.dataUltimaCompra ? format(new Date(c.dataUltimaCompra), "dd/MM/yyyy") : "-"}
                    </td>\n`;

s = s.replace(thToRemove, '');
s = s.replace(tdToRemove, '');

fs.writeFileSync('src/pages/Clientes.tsx', s);
