import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../src/config/firebaseConfig";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login exitoso 🎉");
      navigation.replace("Home"); // Navega a HomeScreen después del login
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title="Ingresar" onPress={handleLogin} />
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
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  link: {
    marginTop: 10,
    color: "blue",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});