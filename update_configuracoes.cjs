const fs = require('fs');
let code = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

code = code.replace(
  "const [numeros, setNumeros] = useState<number[]>([]);",
  `const [numeros, setNumeros] = useState<number[]>([]);
  const [prazo, setPrazo] = useState<number>(7);`
);

code = code.replace(
  "const nums = await configService.getNumerosEspeciais();",
  `const nums = await configService.getNumerosEspeciais();
      const p = await configService.getPrazoConfirmacao();
      setPrazo(p);`
);

code = code.replace(
  "const handleAdd = async (e: React.FormEvent) => {",
  `const handleSavePrazo = async () => {
    setSaving(true);
    try {
      await configService.setPrazoConfirmacao(prazo);
      alert('Prazo salvo com sucesso!');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {`
);

code = code.replace(
  "</div>\n      <div className=\"bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden\">",
  `</div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-neutral-100">
          <h2 className="text-lg font-medium text-neutral-900">Prazo para confirmar cliente especial</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Quantos dias o cliente especial tem para confirmar o recebimento antes de perder a elegibilidade.
          </p>
        </div>
        <div className="p-6 flex items-center space-x-3">
          <input
            type="number"
            min="1"
            value={prazo}
            onChange={e => setPrazo(parseInt(e.target.value) || 1)}
            className="w-24 border border-neutral-300 rounded-lg px-3 py-2 outline-none focus:border-purple-500"
          />
          <span className="text-neutral-500">dias</span>
          <button
            onClick={handleSavePrazo}
            disabled={saving}
            className="ml-4 bg-neutral-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            Salvar Prazo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">`
);

fs.writeFileSync('src/pages/Configuracoes.tsx', code);
