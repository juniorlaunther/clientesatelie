import fs from 'fs';
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');
if (!content.includes('getAuth')) {
  content = content.replace('import { getFirestore } from "firebase/firestore";', 'import { getFirestore } from "firebase/firestore";\nimport { getAuth } from "firebase/auth";');
  content = content.replace('export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);', 'export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);\nexport const auth = getAuth(app);');
  fs.writeFileSync('src/lib/firebase.ts', content);
}
