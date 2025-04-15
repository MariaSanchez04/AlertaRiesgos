import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../src/config/firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      return;
    }

    try {
      setError("");
      setIsLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setIsLoading(false);
        Alert.alert(
          "Verifica tu correo",
          "Debes verificar tu dirección de correo antes de iniciar sesión.",
          [
            { text: "Reenviar Correo", onPress: handleResendVerification },
            { text: "Aceptar" }
          ]
        );
        return;
      }

      setIsLoading(false);
      navigation.replace("Home");

    } catch (err) {
      setIsLoading(false);
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    }
  };

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Correo reenviado", "Revisa tu bandeja de entrada.");
      } catch (error) {
        console.error("Error al reenviar correo:", error.message);
        Alert.alert("Error", "No se pudo reenviar el correo de verificación.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={text => setEmail(text)}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={text => setPassword(text)}
        style={styles.input}
        secureTextEntry
        autoCapitalize="none"
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? "Cargando..." : "Iniciar Sesión"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
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
  loginButton: {
    backgroundColor: "#0370b7",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#0370b7",
    textAlign: "center",
    fontSize: 15,
  },
});
