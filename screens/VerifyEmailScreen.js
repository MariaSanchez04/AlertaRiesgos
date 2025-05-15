import { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { auth } from "../src/config/firebaseConfig";
import { sendEmailVerification, onAuthStateChanged } from "firebase/auth";

const VerifyEmailScreen = ({ navigation }) => {
  const [emailVerified, setEmailVerified] = useState(
    auth.currentUser?.emailVerified
  );
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        setEmailVerified(user.emailVerified);
        if (user.emailVerified) {
          Alert.alert("✅ Correo verificado", "Ahora puedes iniciar sesión.");
          navigation.replace("Login");
        }
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  const handleResendEmail = async () => {
    if (auth.currentUser) {
      setSendingEmail(true);
      try {
        await sendEmailVerification(auth.currentUser);
        Alert.alert(
          "Correo enviado",
          "Revisa tu bandeja de entrada nuevamente."
        );
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo enviar el correo. Intenta más tarde.");
      } finally {
        setSendingEmail(false);
      }
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      await auth.currentUser.reload();
      const verified = auth.currentUser.emailVerified;
      setEmailVerified(verified);
      if (verified) {
        Alert.alert("✅ Correo verificado", "Ahora puedes iniciar sesión.");
        navigation.replace("Login");
      } else {
        Alert.alert("Aún no verificado", "Por favor verifica tu correo.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Hubo un problema al verificar el estado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verifica tu correo electrónico</Text>
      <Text style={styles.subtitle}>
        Hemos enviado un correo a tu bandeja de entrada.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleResendEmail}
        disabled={sendingEmail}
      >
        {sendingEmail ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Reenviar correo</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.outlineButton}
        onPress={handleCheckVerification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#0370b7" />
        ) : (
          <Text style={styles.outlineButtonText}>Ya verifiqué</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default VerifyEmailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#0370b7",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: "#0370b7",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  outlineButtonText: {
    color: "#0370b7",
    fontSize: 16,
    fontWeight: "600",
  },
});
