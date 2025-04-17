import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity
} from "react-native";
import { auth } from "../src/config/firebaseConfig";
import { signOut } from "firebase/auth";
import { FontAwesome5 } from "@expo/vector-icons";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const db = getFirestore();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserInfo({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || ''
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Sesión cerrada exitosamente 🚪");
      navigation.replace("Login");
    } catch (error) {
      alert("Error al cerrar sesión: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />

      <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Bienvenido</Text>
      </Animated.View>

      <View style={styles.userInfoCard}>
        <FontAwesome5 name="user-circle" size={60} color="#444" />
        <Text style={styles.name}>
          {userInfo.firstName && userInfo.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : "Nombre no disponible"}
        </Text>
        <Text style={styles.email}>{userInfo.email || "Correo no disponible"}</Text>
      </View>

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
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    paddingTop: 20,
  },
  welcomeContainer: {
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
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  userInfoCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    width: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cameraButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 3,
  },
  cameraButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  reportsButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
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
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
