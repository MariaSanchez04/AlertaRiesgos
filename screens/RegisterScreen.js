import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { sendEmailVerification } from "firebase/auth";
import { registerUser, auth } from "../src/config/firebaseConfig";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen({ navigation }) {
  const [fName, setFName] = useState("");
  const [lName, setLName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fName || !lName || !email || !password || !confirmPassword) {
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, ingresa un correo electrónico válido");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const user = await registerUser(email, password, fName, lName);

      if (user) {
        await sendEmailVerification(user);
        Alert.alert(
          "Cuenta creada 🎉",
          "Te hemos enviado un correo de verificación. Confirma tu email antes de iniciar sesión.",
          [{ text: "Aceptar", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado");
      } else if (err.code === "auth/invalid-email") {
        setError("Formato de correo inválido");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña es demasiado débil");
      } else {
        setError("Error al crear la cuenta. Intenta nuevamente");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fondo urbano simplificado sin usar LinearGradient
  const cityGradientBackground = () => {
    return (
      <View style={styles.gradientBackground}>
        <View style={styles.cityBuildings}>
          {/* Siluetas de edificios simplificadas */}
          <View
            style={[styles.building, { height: 120, width: 60, left: "5%" }]}
          />
          <View
            style={[styles.building, { height: 180, width: 70, left: "15%" }]}
          />
          <View
            style={[styles.building, { height: 140, width: 80, left: "30%" }]}
          />
          <View
            style={[styles.building, { height: 200, width: 65, left: "45%" }]}
          />
          <View
            style={[styles.building, { height: 160, width: 70, left: "60%" }]}
          />
          <View
            style={[styles.building, { height: 130, width: 50, left: "75%" }]}
          />
          <View
            style={[styles.building, { height: 170, width: 60, left: "85%" }]}
          />
        </View>
      </View>
    );
  };

  // Elementos estrellas para el cielo nocturno
  const starSky = Array(30)
    .fill()
    .map((_, i) => {
      const size = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.7 + 0.3;
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            width: size,
            height: size,
            backgroundColor: "#FFFFFF",
            borderRadius: size / 2,
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 100}%`,
            opacity: opacity,
          }}
        />
      );
    });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <StatusBar barStyle="light-content" />
          <View style={styles.backgroundImage}>
            <View style={styles.gradientBackground}>{starSky}</View>
            {cityGradientBackground()}
            <View style={styles.overlay} />

            <View style={styles.headerContainer}>
              <MaterialIcons name="security" size={48} color="#ffffff" />
              <Text style={styles.appName}>Alerta riesgos</Text>
              <Text style={styles.tagline}>
                Reportando por una ciudad más segura
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.title}>Crear Cuenta</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color="#0370b7"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Nombre"
                  value={fName}
                  onChangeText={setFName}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={22}
                  color="#0370b7"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Apellido"
                  value={lName}
                  onChangeText={setLName}
                  style={styles.input}
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color="#0370b7"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Correo electrónico"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#0370b7"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#0370b7"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color="#0370b7"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#888"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={24}
                    color="#0370b7"
                  />
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Crear Cuenta</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginButtonText}>
                  ¿Ya tienes cuenta? Inicia sesión
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#143A66", // Color base para el fondo urbano
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#051C33", // Color más oscuro en la parte inferior
    zIndex: 0,
  },
  cityBuildings: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "40%",
    zIndex: 0,
  },
  building: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "#02101F", // Siluetas más oscuras
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 20, 50, 0.5)", // Más transparente para ver mejor el fondo
    zIndex: 1,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: height * 0.05,
    marginBottom: 10,
    zIndex: 2,
  },
  appName: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    marginTop: 10,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 16,
    color: "#cce0ff",
    marginTop: 5,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  formContainer: {
    width: width * 0.88,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: width * 0.06,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
    zIndex: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0370b7",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f8ff",
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#dce8f5",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  error: {
    color: "#e74c3c",
    marginLeft: 5,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#0370b7",
    borderRadius: 12,
    height: 55,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#0370b7",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#dce8f5",
  },
  dividerText: {
    color: "#888",
    paddingHorizontal: 10,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: "#0370b7",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#0370b7",
    fontSize: 16,
    fontWeight: "600",
  },
});
