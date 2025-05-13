// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAcKIsSxMy1_cIWXTmwcY5EstPiZmIhQSw",
  authDomain: "chatbot-10bbf.firebaseapp.com",
  projectId: "chatbot-10bbf",
  storageBucket: "chatbot-10bbf.firebasestorage.app",
  messagingSenderId: "1022766460453",
  appId: "1:1022766460453:web:08cc8f1c8be71aba16d9cc",
  measurementId: "G-LV38PQ3MZM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);