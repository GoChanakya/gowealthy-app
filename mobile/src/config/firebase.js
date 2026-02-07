import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAmvcdWfcAoAy-WW9V6INguGTZDJgtl4rs",
  authDomain: "gowealthy-app.firebaseapp.com",
  projectId: "gowealthy-app",
  storageBucket: "gowealthy-app.firebasestorage.app",
  messagingSenderId: "286346696087",
  appId: "1:286346696087:web:655236587b61a24bc060d2",
  measurementId: "G-DVRJ9K3C27"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);