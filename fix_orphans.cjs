const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, doc, deleteDoc } = require("firebase/firestore");
// Wait, I need firebase-admin or the client SDK configured. 
// I can just write a quick script that I run in node, but it needs credentials.
// Actually, I can use the cloudsql-execute-sql ? No, it's firestore.
