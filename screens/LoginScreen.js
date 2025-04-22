import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 👈 Asegúrate de tener esto
import { loginUser } from "../src/config/firebaseConfig";
import { auth, sendEmailVerification } from "../src/config/firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const user = await loginUser(email, password);
      if (!user.emailVerified) {
        Alert.alert(
          "Verifica tu correo",
          "Debes verificar tu dirección de correo antes de iniciar sesión.",
          [
            { text: "Reenviar Correo", onPress: handleResendVerification },
            { text: "Aceptar" },
          ]
        );
        return;
      }

      navigation.replace("Home", { userId: user.uid, email });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No estás registrado. Por favor, regístrate.");
      } else if (error.code === "auth/invalid-credential") {
        setError("Credenciales inválidas. Por favor, revisa tu correo y contraseña.");
      } else {
        setError("Credenciales incorrectas.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        Alert.alert("Correo reenviado", "Revisa tu bandeja de entrada.");
      } catch (error) {
        Alert.alert("Error", "No se pudo reenviar el correo.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {/* Input con ojito usando Ionicons */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Contraseña"
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>
          ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
        </Text>
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
    color: "#ff5733",
    marginBottom: 30,
    textAlign: "center",
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 10,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    height: 55,
    fontSize: 16,
  },
  error: {
    color: "#e74c3c",
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#0370b7",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  link: {
    color: "#333",
    textAlign: "center",
    fontSize: 15,
  },
  linkBold: {
    color: "#0370b7",
    fontWeight: "600",
  },
});
