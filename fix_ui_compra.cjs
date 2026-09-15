const fs = require('fs');
let s = fs.readFileSync('src/pages/ClienteDetalhes.tsx', 'utf8');

// add catalog to useStore destructuring
s = s.replace(
  /const \{ estatisticas \} = useStore\(\);/,
  "const { estatisticas, catalog } = useStore();"
);

s = s.replace(
  /const \[novaCompra, setNovaCompra\] = useState\(\{ produto: '', valor: '', data: format\(new Date\(\), 'yyyy-MM-dd'\) \}\);/,
  "const [novaCompra, setNovaCompra] = useState({ produto: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), codigoProduto: '' });"
);

// update reset
s = s.replace(
  /setNovaCompra\(\{ produto: '', valor: '', data: format\(new Date\(\), 'yyyy-MM-dd'\) \}\);/g,
  "setNovaCompra({ produto: '', valor: '', data: format(new Date(), 'yyyy-MM-dd'), codigoProduto: '' });"
);

// update UI
const inputProd = `              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Produto *</label>
                <div className="flex space-x-2">
                  <select 
                    className="w-1/2 border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                    value={novaCompra.codigoProduto}
                    onChange={e => {
                      const cod = e.target.value;
                      const cat = catalog?.find(c => c.codigosProduto?.[0] === cod);
                      setNovaCompra({...novaCompra, codigoProduto: cod, produto: cat ? cat.nomeOficial : novaCompra.produto});
                    }}
                  >
                    <option value="">(Produto Manual / Avulso)</option>
                    {catalog?.map(c => (
                      <option key={c.id} value={c.codigosProduto?.[0]}>{c.nomeOficial}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={novaCompra.produto}
                    onChange={e => setNovaCompra({...novaCompra, produto: e.target.value})}
                    className="w-1/2 border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
                    placeholder="Nome do produto"
                  />
                </div>
              </div>`;

s = s.replace(
  /<div>\s*<label className="block text-sm font-medium text-neutral-700 mb-1">Produto \*<\/label>\s*<input[^>]+value=\{novaCompra\.produto\}[^>]+>\s*<\/div>/,
  inputProd
);

fs.writeFileSync('src/pages/ClienteDetalhes.tsx', s);
