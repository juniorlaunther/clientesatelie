const fs = require('fs');
let code = fs.readFileSync('src/services/importService.ts', 'utf8');

code = code.replace(
  "import { collection, doc, writeBatch, getDocs, query, orderBy, limit, getDoc, setDoc, updateDoc } from 'firebase/firestore';",
  "import { collection, doc, writeBatch, getDocs, query, orderBy, limit, getDoc, setDoc, updateDoc, where } from 'firebase/firestore';"
);

fs.writeFileSync('src/services/importService.ts', code);
