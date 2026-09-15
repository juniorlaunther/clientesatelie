import fs from 'fs';
let settings = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

const states = `
  const [migrationPreview, setMigrationPreview] = React.useState<any>(null);
  const [migrationLog, setMigrationLog] = React.useState<string>('');
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [showMigModal, setShowMigModal] = React.useState(false);

  React.useEffect(() => {
    migrationService.getMigrationPreview().then(setMigrationPreview).catch(console.error);
  }, []);

  const openMigration = async () => {
    setShowMigModal(true);
    setMigrationLog('Carregando prévia...');
    try {
       const preview = await migrationService.getMigrationPreview();
       setMigrationPreview(preview);
       setMigrationLog('');
    } catch (e: any) {
       setMigrationLog('Erro ao carregar prévia: ' + e.message);
    }
  };

  const confirmMigration = async () => {
    if (!migrationPreview || migrationPreview.isCompleted) return;
    setIsMigrating(true);
    try {
      await migrationService.runSummaryMigration((msg) => setMigrationLog(msg));
      const post = await migrationService.getMigrationPreview();
      setMigrationPreview(post);
      setMigrationLog('Otimização concluída com sucesso!');
    } catch (e: any) {
      setMigrationLog('Erro: ' + e.message);
    } finally {
      setIsMigrating(false);
    }
  };
`;

settings = settings.replace("const [saving, setSaving] = useState(false);", "const [saving, setSaving] = useState(false);\n" + states);
fs.writeFileSync('src/pages/Configuracoes.tsx', settings);
