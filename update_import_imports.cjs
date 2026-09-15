const fs = require('fs');
let code = fs.readFileSync('src/services/importService.ts', 'utf8');
code = code.replace(
  "import { doc, getDocs, collection, setDoc, query, orderBy, writeBatch } from 'firebase/firestore';",
  "import { doc, getDoc, getDocs, collection, setDoc, query, orderBy, writeBatch, limit, where, updateDoc } from 'firebase/firestore';"
);
fs.writeFileSync('src/services/importService.ts', code);
