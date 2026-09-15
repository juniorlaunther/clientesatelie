const fs = require('fs');
let s = fs.readFileSync('src/services/catalogService.ts', 'utf8');

s = s.replace(
  /import \{ collection, doc, getDoc, getDocs, updateDoc, writeBatch \} from 'firebase\/firestore';/,
  "import { collection, doc, getDoc, getDocs, updateDoc, writeBatch, query, where } from 'firebase/firestore';"
);

fs.writeFileSync('src/services/catalogService.ts', s);
