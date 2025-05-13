import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  Modal,
  TouchableHighlight,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../src/config/firebaseConfig";
import { signOut } from "firebase/auth";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    photoURL: "",
  });

  const [reportes, setReportes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [allNotificaciones, setAllNotificaciones] = useState([]);
  const [cantidadNotificaciones, setCantidadNotificaciones] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [viewingAllNotifications, setViewingAllNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const db = getFirestore();
  const storage = getStorage();

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
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
          });
        }
      }
    };
    fetchUserData();
  }, []);

  const requestPermission = async (permissionType) => {
    if (permissionType === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita permiso para acceder a la cámara",
          [{ text: "OK" }]
        );
        return false;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita permiso para acceder a la galería",
          [{ text: "OK" }]
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermission("media");
    if (!hasPermission) return;

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
    const hasPermission = await requestPermission("camera");
    if (!hasPermission) return;

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
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "profile.jpg",
      });
      formData.append("upload_preset", "reportes");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dd3y0fvce/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!data.secure_url) {
        throw new Error("No se recibió la URL segura de la imagen");
      }

      const url = data.secure_url;

      // Actualizar Firestore
      const userId = auth.currentUser.uid;
      await updateDoc(doc(db, "users", userId), {
        photoURL: url,
      });

      setUserInfo((prev) => ({ ...prev, photoURL: url }));
      Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
    } catch (error) {
      console.error("Error al subir imagen a Cloudinary:", error);
      Alert.alert("Error", "No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Fecha no disponible";
    if (timestamp.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleString();
    if (timestamp.toDate && typeof timestamp.toDate === "function")
      return timestamp.toDate().toLocaleString();
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    return "Fecha no disponible";
  };

  useEffect(() => {
    const q = query(
      collection(db, "reportes"),
      orderBy("creadoEn", "desc"),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const reportesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReportes(reportesData);

      const ahora = new Date();
      const unaHoraAntes = new Date(ahora.getTime() - 60 * 60 * 1000); // 1 hora

      const nuevasNotificaciones = reportesData
        .filter((reporte) => {
          const creadoEn =
            reporte.creadoEn?.toDate?.() ??
            new Date(reporte.creadoEn?.seconds * 1000);
          return creadoEn > unaHoraAntes;
        })
        .map((reporte) => ({
          id: reporte.id,
          title: "Nuevo Reporte",
          body: reporte.descripcion
            ? reporte.descripcion.substring(0, 50) + "..."
            : "Sin descripción",
          time: formatTimestamp(reporte.creadoEn),
          leido: false,
          isNew: true,
        }));

      setNotificaciones(nuevasNotificaciones);
      setCantidadNotificaciones(
        nuevasNotificaciones.filter((n) => !n.leido).length
      );
    });
    return () => unsubscribe();
  }, [db]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Error al cerrar sesión", error.message);
    }
  };

const handleNotificationPress = (reportId) => {
  const updated = notificaciones.map((notif) =>
    notif.id === reportId ? { ...notif, leido: true, isNew: false } : notif
  );
  setNotificaciones(updated);
  setCantidadNotificaciones(updated.filter(n => !n.leido).length);

  const updatedAll = allNotificaciones.map((notif) =>
    notif.id === reportId ? { ...notif, leido: true, isNew: false } : notif
  );
  setAllNotificaciones(updatedAll);

  setModalVisible(false);
  navigation.navigate("ReporteDetalle", { reportId });
};


  const fetchAllNotifications = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reportes"), orderBy("creadoEn", "desc"));
      const querySnapshot = await getDocs(q);
      const reportesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const todasLasNotificaciones = reportesData.map((reporte, index) => ({
        id: reporte.id,
        title: "Reporte",
        body: reporte.descripcion
          ? reporte.descripcion.substring(0, 50) + "..."
          : "Sin descripción",
        time: formatTimestamp(reporte.creadoEn),
        leido: false,
        isNew: index < 5,
      }));
      setAllNotificaciones(todasLasNotificaciones);
      setViewingAllNotifications(true);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item.id)}
      style={[
        styles.notificationItem,
        item.isNew && styles.newNotificationItem,
      ]}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationText}>{item.title}</Text>
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>Nuevo</Text>
          </View>
        )}
      </View>
      <Text style={styles.notificationBody}>{item.body}</Text>
      <Text style={styles.notificationTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffff" />
      <TouchableOpacity
        style={styles.notificationBell}
        onPress={() => {
          setViewingAllNotifications(false);
          setModalVisible(true);
        }}
      >
        <FontAwesome5 name="bell" size={24} color="#334155" />
        {cantidadNotificaciones > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {cantidadNotificaciones > 9 ? "9+" : cantidadNotificaciones}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Modal de Notificaciones */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setViewingAllNotifications(false);
        }}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {viewingAllNotifications
                ? "Todas las Notificaciones"
                : "Notificaciones Recientes"}
            </Text>
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#2563eb"
                style={styles.loadingIndicator}
              />
            ) : (
              <FlatList
                data={
                  viewingAllNotifications ? allNotificaciones : notificaciones
                }
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id}
                style={styles.notificationList}
              />
            )}
            {!viewingAllNotifications && (
              <TouchableOpacity
                onPress={fetchAllNotifications}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllButtonText}>
                  Ver todas las notificaciones
                </Text>
              </TouchableOpacity>
            )}
            <TouchableHighlight
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setViewingAllNotifications(false);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar foto de perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.photoModalContainer}>
            <Text style={styles.modalTitle}>Cambiar Foto de Perfil</Text>

            <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
              <FontAwesome5
                name="camera"
                size={24}
                color="#2563eb"
                style={styles.photoOptionIcon}
              />
              <Text style={styles.photoOptionText}>Tomar una foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
              <FontAwesome5
                name="image"
                size={24}
                color="#2563eb"
                style={styles.photoOptionIcon}
              />
              <Text style={styles.photoOptionText}>Elegir de la galería</Text>
            </TouchableOpacity>

            <TouchableHighlight
              style={styles.cancelButton}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableHighlight>
          </View>
        </View>
      </Modal>

      <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Bienvenido</Text>
      </Animated.View>

      <View style={styles.userInfoCard}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={() => setPhotoModalVisible(true)}
        >
          {uploadingPhoto ? (
            <View style={styles.loadingImageContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : userInfo.photoURL ? (
            <Image
              source={{ uri: userInfo.photoURL }}
              style={styles.profileImage}
            />
          ) : (
            <FontAwesome5 name="user-circle" size={80} color="#aaa" />
          )}
          <View style={styles.cameraIconOverlay}>
            <FontAwesome5 name="camera" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>
          {userInfo.firstName && userInfo.lastName
            ? `${userInfo.firstName} ${userInfo.lastName}`
            : "Nombre no disponible"}
        </Text>
        <Text style={styles.email}>
          {userInfo.email || "Correo no disponible"}
        </Text>
        <TouchableOpacity
          style={styles.changePhotoButton}
          onPress={() => setPhotoModalVisible(true)}
          disabled={uploadingPhoto}
        >
          <Text style={styles.changePhotoText}>
            {uploadingPhoto ? "Subiendo..." : "Cambiar foto"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => navigation.navigate("Takephoto")}
      >
        <Text style={styles.cameraButtonText}>Crear reporte</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.reportsButton}
        onPress={() => navigation.navigate("Reportes")}
      >
        <Text style={styles.reportsButtonText}>Ver Reportes Enviados</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  profileImageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIconOverlay: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: "#2563eb",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  loadingImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoModalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  photoOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  photoOptionIcon: {
    marginRight: 15,
  },
  photoOptionText: {
    fontSize: 16,
    color: "#333",
  },
  cancelButton: {
    marginTop: 15,
    backgroundColor: "#f3f4f6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
  },
  changePhotoButton: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  changePhotoText: {
    color: "#fff",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f5f7fa",
    paddingTop: 20,
  },
  notificationBell: {
    position: "absolute",
    top: 40,
    right: 25,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  notificationList: {
    maxHeight: 400,
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  newNotificationItem: {
    backgroundColor: "#f0f9ff", // Fondo azul claro para resaltar nuevas notificaciones
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#22c55e", // Verde para indicar "nuevo"
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  notificationBody: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  emptyListText: {
    textAlign: "center",
    padding: 20,
    color: "#6b7280",
  },
  loadingIndicator: {
    padding: 20,
  },
  viewAllButton: {
    marginTop: 15,
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
  },
  viewAllButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: "#666",
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
