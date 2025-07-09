import { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../src/config/firebaseConfig";
import { sendPasswordResetEmail } from "firebase/auth";
import { ThemeContext } from "../src/context/ThemeContext";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [showEmail, setShowEmail] = useState(true); 
  const [isLoading, setIsLoading] = useState(false);

  // Contexto de tema global
  const { theme } = useContext(ThemeContext);
  const themeStyles = theme === "light" ? lightStyles : darkStyles;

  const handleSendReset = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu correo electrónico.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert(
        "Correo enviado",
        "Revisa tu bandeja de entrada para restablecer tu contraseña."
      );
      navigation.goBack();
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        Alert.alert("Error", "No existe una cuenta con ese correo.");
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "El correo no es válido.");
      } else {
        Alert.alert("Error", "No se pudo enviar el correo. Intenta más tarde.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={themeStyles.container}>
      <Text style={themeStyles.title}>Reiniciar contraseña</Text>
      <View style={themeStyles.inputContainer}>
        <Ionicons name="mail-outline" size={22} color={theme === "light" ? "#0370b7" : "#60a5fa"} />
        <TextInput
          style={themeStyles.input}
          placeholder="Correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor={theme === "light" ? "#888" : "#bbb"}
        />
      </View>

      <TouchableOpacity
        style={[themeStyles.button, isLoading && themeStyles.buttonDisabled]}
        onPress={handleSendReset}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={themeStyles.buttonText}>Enviar enlace por correo</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Estilos para tema claro
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    color: "#0370b7",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#0370b7",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#0370b7",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

// Estilos para tema oscuro
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#0f172a",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    color: "#60a5fa",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#60a5fa",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginBottom: 16,
    backgroundColor: "#1e293b",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#fff",
  },
  button: {
    backgroundColor: "#2563eb",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
