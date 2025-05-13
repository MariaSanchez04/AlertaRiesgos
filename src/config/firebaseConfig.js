import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFirestore,
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { Alert } from "react-native";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyChtka2Wkc9cKaTfl4nDm3Cd4CN9hqhFDA",
  authDomain: "proyecto-d8a81.firebaseapp.com",
  projectId: "proyecto-d8a81",
  storageBucket: "proyecto-d8a81.firebasestorage.app",
  messagingSenderId: "537197437679",
  appId: "1:537197437679:web:a430db0ed795bcde8db11a",
  measurementId: "G-H5M9B9JC7R",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth con persistencia para React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

// Mostrar mensajes de alerta
export const showMessage = (message) => {
  Alert.alert("Mensaje", message);
};

// Obtener datos del usuario desde Firestore
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error("User data not found.");
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Registrar nuevo usuario (rol por defecto: ciudadano)
export const registerUser = async (email, password, firstName, lastName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      firstName,
      lastName,
      role: "ciudadano", // Rol predeterminado
    });

    console.log("Cuenta creada exitosamente");
    return userCredential.user;
  } catch (error) {
    const errorCode = error.code;
    let errorMessage = "Error al crear la cuenta";

    if (errorCode === "auth/email-already-in-use") {
      errorMessage = "Este correo ya está en uso";
    } else if (errorCode === "auth/invalid-email") {
      errorMessage = "Correo electrónico inválido";
    } else if (errorCode === "auth/weak-password") {
      errorMessage = "La contraseña es demasiado débil";
    }

    console.error(errorMessage);
    throw error;
  }
};

// Asegura que el usuario tenga un rol (para usuarios antiguos)
export const ensureUserRole = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (!userData.role) {
        await updateDoc(userRef, { role: "ciudadano" });
        console.log("Rol asignado automáticamente: ciudadano");
      }
    }
  } catch (error) {
    console.error("Error al asignar rol predeterminado:", error);
  }
};

// Iniciar sesión
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Asegurar rol si falta
    await ensureUserRole(user.uid);

    console.log("Inicio de sesión exitoso");
    return user;
  } catch (error) {
    console.error("Error en inicio de sesión:", error);
    throw error;
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("Sesión cerrada exitosamente");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    throw error;
  }
};

// Observar cambios en el estado de autenticación
export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { app, auth, db };
export default app;
