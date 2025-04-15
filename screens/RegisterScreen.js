import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../src/config/firebaseConfig";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validaciones
    if (!email || !password || !confirmPassword) {
      setError("Por favor, completa todos los campos");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    try {
      setError("");
      setIsLoading(true);
      
      // Crear usuario en Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Enviar correo de verificación
      await sendEmailVerification(user);
      setIsLoading(false);

      Alert.alert(
        "Cuenta creada 🎉",
        "Te hemos enviado un correo de verificación. Confirma tu email antes de iniciar sesión.",
        [{ text: "Aceptar", onPress: () => navigation.navigate("Login") }]
      );

    } catch (err) {
      setIsLoading(false);

      // Mensajes de error personalizados
      if (err.code === 'auth/email-already-in-use') {
        setError("Este correo ya está registrado");
      } else if (err.code === 'auth/invalid-email') {
        setError("Formato de correo inválido");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña es demasiado débil");
      } else {
        setError("Error al crear la cuenta. Intenta nuevamente");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear Cuenta</Text>
      
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={(text) => setEmail(text)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={(text) => setPassword(text)}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={(text) => setConfirmPassword(text)}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity 
        style={styles.registerButton} 
        onPress={handleRegister}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.registerButtonText}>Crear Cuenta</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.loginText}>¿Ya tienes cuenta? Inicia sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 30,
    textAlign: "center"
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
    fontSize: 16,
  },
  error: {
    color: "#e74c3c",
    marginBottom: 16,
    textAlign: "center",
  },
  registerButton: {
    backgroundColor: "#0370b7",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  registerButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loginButton: {
    alignItems: "center",
    padding: 10,
  },
  loginText: {
    color: "#0370b7",
    fontSize: 15,
  },
});
