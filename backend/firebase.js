// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDZF0xW2MOOG_7cAAtv8Za_cPXH4qpQLxo",
    authDomain: "herizon-code-debug.firebaseapp.com",
    projectId: "herizon-code-debug",
    storageBucket: "herizon-code-debug.firebasestorage.app",
    messagingSenderId: "508375561617",
    appId: "1:508375561617:web:185d7f9af8e34e48a65630",
    measurementId: "G-EZZCSBK2QM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);