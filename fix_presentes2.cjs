const fs = require('fs');
let code = fs.readFileSync('src/pages/Presentes.tsx', 'utf8');

code = code.split('\\`').join('`').split('\\$').join('$').split('\\\\').join('\\');

fs.writeFileSync('src/pages/Presentes.tsx', code);
