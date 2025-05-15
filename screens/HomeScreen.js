import { useState, useEffect, useMemo } from "react";
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
  Alert,
} from "react-native";
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
  onSnapshot,
} from "firebase/firestore";

const HomeScreen = ({ navigation }) => {
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    photoURL: "",
    role: "",
  });

  const [reportes, setReportes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [allNotificaciones, setAllNotificaciones] = useState([]);
  const [cantidadNotificaciones, setCantidadNotificaciones] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewingAllNotifications, setViewingAllNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
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
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
            role: data.role || "",
          });
        }
      }
    };
    fetchUserData();
  }, []);

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
    setCantidadNotificaciones(updated.filter((n) => !n.leido).length);

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

      <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Bienvenido</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate("Perfil")}
        >
          <Text style={styles.profileButtonText}>Mi Perfil</Text>
          <FontAwesome5
            name="user"
            size={16}
            color="#fff"
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate("Takephoto")}
        >
          <FontAwesome5
            name="camera"
            size={24}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Crear reporte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainButton}
          onPress={() => navigation.navigate("Reportes")}
        >
          <FontAwesome5
            name="clipboard-list"
            size={24}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Ver Reportes Enviados</Text>
        </TouchableOpacity>

        {userInfo.role === "admin" && (
          <TouchableOpacity
            style={styles.mainButton}
            onPress={() => navigation.navigate("AdminScreen")}
          >
            <FontAwesome5
              name="user-shield"
              size={24}
              color="#fff"
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Panel de Administración</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <FontAwesome5
            name="sign-out-alt"
            size={20}
            color="#fff"
            style={styles.buttonIcon}
          />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#f0f9ff",
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
    backgroundColor: "#22c55e",
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
    justifyContent: "space-between",
    marginBottom: 30,
    marginTop: 50,
    flexDirection: "row",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#334155",
  },
  profileButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 6,
  },
  profileIcon: {
    marginLeft: 2,
  },
  buttonsContainer: {
    width: "85%",
    marginTop: 10,
  },
  mainButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
