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
import { loginUser } from "../src/config/firebaseConfig";
import { auth, sendEmailVerification } from "../src/config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/config/firebaseConfig";

const { width, height } = Dimensions.get("window");

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

      // Verifica si está bloqueado
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().blocked === true) {
        Alert.alert("Acceso denegado", "Tu cuenta está bloqueada.");
        return;
      }

      navigation.replace("Home", { userId: user.uid, email });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setError("No estás registrado. Por favor, regístrate.");
      } else if (error.code === "auth/invalid-credential") {
        setError("Credenciales inválidas. Revisa tu correo y contraseña.");
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
              <Text style={styles.title}>Iniciar sesión</Text>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color="#0370b7"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder="Correo electrónico"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
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

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#e74c3c" />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPasswordLink}
                onPress={() => navigation.navigate("ForgotPassword")}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={() => navigation.navigate("Register")}
              >
                <Text style={styles.registerButtonText}>
                  Crear una cuenta nueva
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
    marginTop: height * 0.08,
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
    marginTop: 20,
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
    marginBottom: 24,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f8ff",
    borderRadius: 12,
    marginBottom: 16,
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
    marginBottom: 16,
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
  forgotPasswordLink: {
    alignSelf: "center",
    marginBottom: 20,
    padding: 5, // Área de toque más grande
  },
  forgotPasswordText: {
    color: "#0370b7",
    fontSize: 14,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
  registerButton: {
    borderWidth: 1,
    borderColor: "#0370b7",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  registerButtonText: {
    color: "#0370b7",
    fontSize: 16,
    fontWeight: "600",
  },
});
