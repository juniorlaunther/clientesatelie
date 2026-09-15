import fs from 'fs';
let content = fs.readFileSync('src/pages/Importar.tsx', 'utf8');

const oldParse = `const parseDate = (dateStr: string) => {
  try {
    const d = parse(dateStr, 'dd/MM/yyyy HH:mm:ss', new Date());
    return d.getTime();
  } catch {
    return 0;
  }
};`;

const newParse = `const parseDate = (dateStr: string) => {
  if (!dateStr) return 0;
  try {
    const d = parse(dateStr, 'dd/MM/yyyy HH:mm:ss', new Date());
    const time = d.getTime();
    return isNaN(time) ? 0 : time;
  } catch {
    return 0;
  }
};`;

content = content.replace(oldParse, newParse);
fs.writeFileSync('src/pages/Importar.tsx', content);
