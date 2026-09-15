const fs = require('fs');
let code = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const stateStr = `  const [stats, setStats] = useState<any>(null);
  
  const [lastImport, setLastImport] = useState<Importacao | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);

  React.useEffect(() => {
    loadLastImport();
  }, [status]);

  const loadLastImport = async () => {
    try {
      const imp = await importService.getLastSuccessfulImport();
      setLastImport(imp);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUndo = async () => {
    if (!lastImport) return;
    setUndoing(true);
    try {
      await importService.undoImport(lastImport.id);
      setShowUndoModal(false);
      setLastImport(null);
      setStatus('idle');
      setFile(null);
      setParsedData([]);
      alert('Importação desfeita com sucesso!');
    } catch (err: any) {
      alert('Erro ao desfazer: ' + err.message);
    } finally {
      setUndoing(false);
    }
  };`;

code = code.replace("const [stats, setStats] = useState<any>(null);", stateStr);
fs.writeFileSync('src/pages/Importar.tsx', code);
