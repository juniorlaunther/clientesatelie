const fs = require('fs');
let s = fs.readFileSync('src/lib/firebase.ts', 'utf8');

s = s.replace(
  /export const db = getFirestore\(app\);/,
  "const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;\nexport const db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);"
);

fs.writeFileSync('src/lib/firebase.ts', s);
