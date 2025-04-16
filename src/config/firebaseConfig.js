import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  setDoc, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { Alert } from 'react-native';

// Configuración de Firebase (usando la segunda)
const firebaseConfig = {
  apiKey: "AIzaSyChtka2Wkc9cKaTfl4nDm3Cd4CN9hqhFDA",
  authDomain: "proyecto-d8a81.firebaseapp.com",
  projectId: "proyecto-d8a81",
  storageBucket: "proyecto-d8a81.firebasestorage.app",
  messagingSenderId: "537197437679",
  appId: "1:537197437679:web:a430db0ed795bcde8db11a",
  measurementId: "G-H5M9B9JC7R"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);

// Función para mostrar mensajes
export const showMessage = (message) => {
  Alert.alert('Mensaje', message);
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

// Registrar usuario
export const registerUser = async (email, password, firstName, lastName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      firstName,
      lastName
    });
    console.log("Cuenta creada exitosamente");
    return userCredential.user;
  } catch (error) {
    const errorCode = error.code;
    let errorMessage = 'Error al crear la cuenta';

    if (errorCode === 'auth/email-already-in-use') {
      errorMessage = 'Este correo ya está en uso';
    } else if (errorCode === 'auth/invalid-email') {
      errorMessage = 'Correo electrónico inválido';
    } else if (errorCode === 'auth/weak-password') {
      errorMessage = 'La contraseña es demasiado débil';
    }

    console.error(errorMessage);
    throw error;
  }
};

// Iniciar sesión
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Inicio de sesión exitoso");
    return userCredential.user;
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

export default app;
