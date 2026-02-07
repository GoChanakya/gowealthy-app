import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCd2fdPYPteg_EPBevAL1BZTIQ_eDWnEas",
  authDomain: "gowealthy-78c45.firebaseapp.com",
  projectId: "gowealthy-78c45",
  storageBucket: "gowealthy-78c45.firebasestorage.app",
  messagingSenderId: "1044041259575",
  appId: "1:1044041259575:web:a3f8116c0491dc76e1bdb2",
  measurementId: "G-BQTSKGMFDN"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);