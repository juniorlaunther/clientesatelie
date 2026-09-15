const fs = require('fs');
let s = fs.readFileSync('src/services/clientService.ts', 'utf8');

// Add imports at the top
s = s.replace(
  /import \{ statsService \} from '\.\/statsService';/,
  "import { statsService } from './statsService';\nimport { catalogService } from './catalogService';\nimport { getCountFromServer } from 'firebase/firestore';"
);

// Remove requires
s = s.replace(/const \{ query, where, collection, getDocs, doc, updateDoc, getDoc \} = require\('firebase\/firestore'\);\n/, "");
s = s.replace(/const \{ query, where, getCountFromServer \} = require\('firebase\/firestore'\);\n/, "");
s = s.replace(/const \{ getDoc \} = require\('firebase\/firestore'\);\n/, "");
s = s.replace(/await require\('firebase\/firestore'\)\.getDoc/g, "await getDoc");
s = s.replace(/await require\('firebase\/firestore'\)\.getDocs/g, "await getDocs");
s = s.replace(/await require\('\.\/catalogService'\)\.catalogService/g, "await catalogService");

fs.writeFileSync('src/services/clientService.ts', s);
