import fs from 'fs';
let settings = fs.readFileSync('src/pages/Configuracoes.tsx', 'utf8');

const regex = /const \[migrationPreview, setMigrationPreview\] = React\.useState<any>\(null\);/;

const newInit = `
  const [migrationPreview, setMigrationPreview] = React.useState<any>(null);
  
  React.useEffect(() => {
    migrationService.getMigrationPreview().then(setMigrationPreview).catch(console.error);
  }, []);
`;

settings = settings.replace(regex, newInit.trim());
fs.writeFileSync('src/pages/Configuracoes.tsx', settings);
