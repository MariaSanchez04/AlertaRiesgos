// screens/PerfilScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableHighlight,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../src/config/firebaseConfig";
import { signOut } from "firebase/auth";
import { FontAwesome5 } from "@expo/vector-icons";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const PerfilScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    photoURL: "",
    role: "",
  });
  const [editedFirstName, setEditedFirstName] = useState("");
  const [editedLastName, setEditedLastName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserInfo({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
            role: data.role || "",
          });
          setEditedFirstName(data.firstName || "");
          setEditedLastName(data.lastName || "");
        }
      }
    };
    fetchUserData();
  }, []);

  const requestPermission = async (permissionType) => {
    const { status } =
      permissionType === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        `Se necesita permiso para acceder a la ${
          permissionType === "camera" ? "cámara" : "galería"
        }`,
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    if (!(await requestPermission("media"))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      await uploadProfileImage(result.assets[0].uri);
    }
    setPhotoModalVisible(false);
  };

  const takePhoto = async () => {
    if (!(await requestPermission("camera"))) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      await uploadProfileImage(result.assets[0].uri);
    }
    setPhotoModalVisible(false);
  };

  const uploadProfileImage = async (uri) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "profile.jpg" });
      formData.append("upload_preset", "reportes");
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dd3y0fvce/image/upload",
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (!data.secure_url) throw new Error("No se recibió URL segura");
      const url = data.secure_url;
      const userId = auth.currentUser.uid;
      await updateDoc(doc(db, "users", userId), { photoURL: url });
      setUserInfo((prev) => ({ ...prev, photoURL: url }));
      Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            navigation.reset({ index: 0, routes: [{ name: "Login" }] });
          } catch {
            Alert.alert("Error", "No se pudo cerrar sesión.");
          }
        },
      },
    ]);
  };

  const handleSaveChanges = async () => {
    if (!editedFirstName.trim() || !editedLastName.trim()) {
      Alert.alert("Error", "El nombre y apellido no pueden estar vacíos");
      return;
    }
    try {
      const userId = auth.currentUser.uid;
      await updateDoc(doc(db, "users", userId), {
        firstName: editedFirstName,
        lastName: editedLastName,
      });
      setUserInfo((prev) => ({
        ...prev,
        firstName: editedFirstName,
        lastName: editedLastName,
      }));
      setIsEditing(false);
      Alert.alert("Éxito", "Nombre actualizado correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el nombre");
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      {/* Modal foto */}
      <Modal
        animationType="slide"
        transparent
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.photoModalContainer}>
            <Text style={styles.modalTitle}>Cambiar Foto de Perfil</Text>

            <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
              <FontAwesome5 name="camera" size={24} color="#2563eb" />
              <Text style={styles.photoOptionText}>Tomar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
              <FontAwesome5 name="image" size={24} color="#2563eb" />
              <Text style={styles.photoOptionText}>Elegir de la galería</Text>
            </TouchableOpacity>

            <TouchableHighlight style={styles.cancelButton} onPress={() => setPhotoModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      {/* Foto de perfil */}
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => setPhotoModalVisible(true)}>
          {uploadingPhoto ? (
            <View style={styles.loadingImageContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : userInfo.photoURL ? (
            <Image source={{ uri: userInfo.photoURL }} style={styles.profileImage} />
          ) : (
            <FontAwesome5 name="user-circle" size={100} color="#aaa" />
          )}
          <View style={styles.cameraIconOverlay}>
            <FontAwesome5 name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPhotoModalVisible(true)} disabled={uploadingPhoto}>
          <Text style={styles.changePhotoText}>{uploadingPhoto ? "Subiendo..." : "Cambiar foto"}</Text>
        </TouchableOpacity>
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Nombre completo</Text>
          {isEditing ? (
            <>
              <TextInput
                style={styles.input}
                value={editedFirstName}
                onChangeText={setEditedFirstName}
                placeholder="Nombre"
                autoFocus
              />
              <TextInput
                style={styles.input}
                value={editedLastName}
                onChangeText={setEditedLastName}
                placeholder="Apellido"
              />
            </>
          ) : (
            <Text style={styles.infoValue}>
              {userInfo.firstName && userInfo.lastName
                ? `${userInfo.firstName} ${userInfo.lastName}`
                : "Nombre no disponible"}
            </Text>
          )}
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Correo electrónico</Text>
          <Text style={styles.infoValue}>{userInfo.email || "No disponible"}</Text>
        </View>

        {userInfo.role?.trim().toLowerCase() === "admin" && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Rol</Text>
            <Text style={styles.infoValue}>{userInfo.role}</Text>
          </View>
        )}
      </View>

      {/* Botones de acción */}
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
      >
        <FontAwesome5
          name={isEditing ? "save" : "user-edit"}
          size={16}
          color="#fff"
          style={styles.buttonIcon}
        />
        <Text style={styles.buttonText}>
          {isEditing ? "Guardar cambios" : "Editar información"}
        </Text>
      </TouchableOpacity>

      {/* Botón Cambiar contraseña */}
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <FontAwesome5 name="lock" size={16} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Cambiar contraseña</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <FontAwesome5 name="sign-out-alt" size={16} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#334155" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 25,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  photoOptionText: { fontSize: 16, color: "#333", marginLeft: 15 },
  cancelButton: { marginTop: 15, backgroundColor: "#f3f4f6", padding: 10, borderRadius: 5 },
  cancelButtonText: { color: "#333", fontWeight: "bold" },
  profileContainer: { alignItems: "center", marginVertical: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  loadingImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
  },
  cameraIconOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    borderRadius: 20,
    padding: 6,
  },
  changePhotoText: { color: "#2563eb", fontWeight: "bold", marginTop: 10 },
  infoContainer: { paddingHorizontal: 20, marginBottom: 20 },
  infoItem: { marginBottom: 20 },
  infoLabel: { fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 6 },
  infoValue: { fontSize: 18, color: "#334155" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 10,
    backgroundColor: "#fff",
    color: "#334155",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    marginHorizontal: 40,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonIcon: { marginRight: 8 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    marginHorizontal: 40,
    borderRadius: 8,
    marginBottom: 30,
  },
});

export default PerfilScreen;
