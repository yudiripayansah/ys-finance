// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDHyeSQA42Dh952UROWS7Q4Hps9i-oa2co",
  authDomain: "ys-finance.firebaseapp.com",
  projectId: "ys-finance",
  storageBucket: "ys-finance.firebasestorage.app",
  messagingSenderId: "527209344147",
  appId: "1:527209344147:web:1fe3ac88f15cad23eff166",
  measurementId: "G-B784KGF3YC"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {});

export { auth, db };