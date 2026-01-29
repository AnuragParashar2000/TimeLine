import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAi8QqZgYhc72frxJTycrPjQs24usbRIhQ",
    authDomain: "timeline-5d7cf.firebaseapp.com",
    projectId: "timeline-5d7cf",
    storageBucket: "timeline-5d7cf.firebasestorage.app",
    messagingSenderId: "958530943274",
    appId: "1:958530943274:web:ac50e79e38ec409e798653",
    measurementId: "G-LL6B98J5KT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
