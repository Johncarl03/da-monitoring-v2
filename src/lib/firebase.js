import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7DxOW-Hz9Rola5sCtqLWlOvYPCJpLebA",
  authDomain: "departmentofagriculture-69318.firebaseapp.com",
  projectId: "departmentofagriculture-69318",
  storageBucket: "departmentofagriculture-69318.firebasestorage.app",
  messagingSenderId: "384823595261",
  appId: "1:384823595261:web:a842f5ea10dd6368082e94",
  measurementId: "G-4NGS2G6J0T"
};

// Initialize Firebase (Safe setup para sa Next.js)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);