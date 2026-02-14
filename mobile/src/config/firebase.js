// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: "AIzaSyAmvcdWfcAoAy-WW9V6INguGTZDJgtl4rs",
//   authDomain: "gowealthy-app.firebaseapp.com",
//   projectId: "gowealthy-app",
//   storageBucket: "gowealthy-app.firebasestorage.app",
//   messagingSenderId: "286346696087",
//   appId: "1:286346696087:web:655236587b61a24bc060d2",
//   measurementId: "G-DVRJ9K3C27"
// };

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCd2fdPYPteg_EPBevAL1BZTIQ_eDWnEas",
  authDomain: "gowealthy-78c45.firebaseapp.com",
  projectId: "gowealthy-78c45",
  storageBucket: "gowealthy-78c45.firebasestorage.app",
  messagingSenderId: "1044041259575",
  appId: "1:1044041259575:web:a3f8116c0491dc76e1bdb2"
};

// Initialize only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);