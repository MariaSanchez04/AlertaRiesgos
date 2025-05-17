// screens/ChangePassword.js

import React, { useState } from "react";
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
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reautenticar al usuario
  const reauthenticate = (password) => {
    const user = auth.currentUser;
    const cred = EmailAuthProvider.credential(user.email, password);
    return reauthenticateWithCredential(user, cred);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      await reauthenticate(currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      Alert.alert("Éxito", "Contraseña actualizada.");
      navigation.goBack();
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        Alert.alert("Error", "Contraseña actual incorrecta.");
      } else {
        Alert.alert("Error", "No se pudo actualizar. Intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordInput = (
    label,
    value,
    onChange,
    show,
    setShow,
    placeholder
  ) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#888"
      />
      <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeIcon}>
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={24}
          color="#0370b7"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cambiar contraseña</Text>

      {renderPasswordInput(
        "Actual",
        currentPassword,
        setCurrentPassword,
        showCurrent,
        setShowCurrent,
        "Contraseña actual"
      )}
      {renderPasswordInput(
        "Nueva",
        newPassword,
        setNewPassword,
        showNew,
        setShowNew,
        "Nueva contraseña"
      )}
      {renderPasswordInput(
        "Confirmar",
        confirmPassword,
        setConfirmPassword,
        showConfirm,
        setShowConfirm,
        "Confirmar contraseña"
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Actualizar contraseña</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
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
    marginBottom: 16,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: "#0370b7",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
