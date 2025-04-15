import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyChtka2Wkc9cKaTfl4nDm3Cd4CN9hqhFDA",
    authDomain: "proyecto-d8a81.firebaseapp.com",
    projectId: "proyecto-d8a81",
    storageBucket: "proyecto-d8a81.firebasestorage.app",
    messagingSenderId: "537197437679",
    appId: "1:537197437679:web:a430db0ed795bcde8db11a",
    measurementId: "G-H5M9B9JC7R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore(app);

export default app;