import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Animated, 
  TouchableOpacity 
} from "react-native";
import moment from "moment-timezone";
import { auth } from "../src/config/firebaseConfig"; 
import { signOut } from "firebase/auth";

const HomeScreen = ({ navigation }) => {
  const [currentTime, setCurrentTime] = useState("");
  const [date, setDate] = useState("");
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // Actualizar hora y fecha
    const updateTime = () => {
      const now = moment().tz("Europe/Madrid");
      setCurrentTime(now.format("HH:mm:ss"));
      setDate(now.format("dddd, D [de] MMMM [de] YYYY"));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, [fadeAnim]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Sesión cerrada exitosamente 🚪");
      navigation.replace("Login"); // Redirigir a la pantalla de inicio de sesión
    } catch (error) {
      alert("Error al cerrar sesión: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
      
      <Animated.View style={[styles.clockContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Hora Actual en España 🇪🇸</Text>
        <Text style={styles.time}>{currentTime}</Text>
        <Text style={styles.date}>{date}</Text>
      </Animated.View>

      <TouchableOpacity style={styles.cameraButton} onPress={() => navigation.navigate('Takephoto')}>
        <Text style={styles.cameraButtonText}>📷 Tomar Foto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reportsButton} onPress={() => navigation.navigate('Reportes')}>
        <Text style={styles.reportsButtonText}>📄 Ver Reportes Enviados</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  clockContainer: {
    padding: 25,
    borderRadius: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    width: "85%",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 15,
    color: "#334155",
  },
  time: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#0369a1",
    letterSpacing: 2,
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 5,
  },
  cameraButton: {
    marginTop: 30,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  reportsButton: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportsButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#d9534f",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
