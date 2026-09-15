const fs = require('fs');
let s = fs.readFileSync('src/services/catalogService.ts', 'utf8');

s = s.replace(/const \{ query, where, collection, getDocs, doc, updateDoc, getDoc \} = require\('firebase\/firestore'\);\n/, "");

fs.writeFileSync('src/services/catalogService.ts', s);
