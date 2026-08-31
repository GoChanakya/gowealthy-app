import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

// Persist Firebase Auth sessions on native. During Fast Refresh Firebase may
// already have an Auth instance, so reuse it instead of initializing twice.
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error?.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

export { auth };
