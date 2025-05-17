import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
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
import { LinearGradient } from "expo-linear-gradient";

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
      duration: 800,
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

    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : timestamp.toDate && typeof timestamp.toDate === "function"
        ? timestamp.toDate()
        : timestamp instanceof Date
          ? timestamp
          : null;

    if (!date) return "Fecha no disponible";

    // Formato más moderno y legible de fecha
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
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
      const rangoDeTiempo = new Date(ahora.getTime() - 30 * 1000); // 30 segundos

      const nuevasNotificaciones = reportesData
        .filter((reporte) => {
          const creadoEn =
            reporte.creadoEn?.toDate?.() ??
            new Date(reporte.creadoEn?.seconds * 1000);
          return creadoEn > rangoDeTiempo;
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
          tipo: reporte.tipo || "General",
          ubicacion: reporte.ubicacion || "No especificada",
        }));

      setNotificaciones(nuevasNotificaciones);
      setCantidadNotificaciones(
        nuevasNotificaciones.filter((n) => !n.leido).length
      );

      // Eliminar notificaciones después de 30 segundos
      nuevasNotificaciones.forEach((notificacion) => {
        setTimeout(() => {
          setNotificaciones((prevNotificaciones) =>
            prevNotificaciones.filter((n) => n.id !== notificacion.id)
          );
          setCantidadNotificaciones((prevCantidad) => Math.max(0, prevCantidad - 1));
        }, 30000);
      });
    });
    return () => unsubscribe();
  }, [db]);

  const handleNotificationPress = (reportId) => {
    // Filtrar la notificación presionada de la lista de notificaciones
    const updatedNotifications = notificaciones.filter(
      (notif) => notif.id !== reportId
    );
    setNotificaciones(updatedNotifications);
    setCantidadNotificaciones(updatedNotifications.filter((n) => !n.leido).length);

    // Actualizar la lista de todas las notificaciones
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

      // Obtener la hora actual y calcular el rango de la última hora
      const ahora = new Date();
      const rangoDeTiempo = new Date(ahora.getTime() - 60 * 60 * 1000); // Última hora

      // Filtrar las notificaciones creadas en la última hora
      const todasLasNotificaciones = reportesData
        .filter((reporte) => {
          const creadoEn =
            reporte.creadoEn?.toDate?.() ??
            new Date(reporte.creadoEn?.seconds * 1000);
          return creadoEn > rangoDeTiempo;
        })
        .map((reporte) => ({
          id: reporte.id,
          title: "Reporte",
          body: reporte.descripcion
            ? reporte.descripcion.substring(0, 50) + "..."
            : "Sin descripción",
          time: formatTimestamp(reporte.creadoEn),
          leido: false,
          isNew: false, // Marcar como no nuevas al ver todas
          tipo: reporte.tipo || "General",
          ubicacion: reporte.ubicacion || "No especificada",
        }));

      setAllNotificaciones(todasLasNotificaciones);
      setNotificaciones([]); // Limpiar las notificaciones nuevas
      setCantidadNotificaciones(0); // Reiniciar el contador de notificaciones nuevas
      setViewingAllNotifications(true);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las notificaciones");
    } finally {
      setLoading(false);
    }
  };

  // Iconos para los diferentes tipos de reportes
  const getTipoIcon = (tipo) => {
    switch (tipo.toLowerCase()) {
      case "robo":
        return "mask";
      case "vandalismo":
        return "spray-can";
      case "accidente":
        return "car-crash";
      case "incendio":
        return "fire";
      case "inundación":
        return "water";
      default:
        return "exclamation-triangle";
    }
  };

  // Color para los diferentes tipos de reportes
  const getTipoColor = (tipo) => {
    switch (tipo.toLowerCase()) {
      case "robo":
        return "#E53935";
      case "vandalismo":
        return "#8E24AA";
      case "accidente":
        return "#FB8C00";
      case "incendio":
        return "#D50000";
      case "inundación":
        return "#039BE5";
      default:
        return "#546E7A";
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
      <View style={styles.notificationIconContainer}>
        <View style={[styles.notificationIcon, { backgroundColor: getTipoColor(item.tipo) }]}>
          <FontAwesome5 name={getTipoIcon(item.tipo)} size={16} color="#fff" />
        </View>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationText}>{item.title}</Text>
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>Nuevo</Text>
            </View>
          )}
        </View>
        <Text style={styles.notificationBody}>{item.body}</Text>
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationLocation}>
            <FontAwesome5 name="map-marker-alt" size={10} color="#64748B" /> {item.ubicacion}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={[styles.greeting, { marginTop: 10 }]}>Hola, {userInfo.firstName}</Text>
            <Text style={styles.subtitle}>Manteniendo seguro tu barrio</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationBell}
              onPress={() => {
                setViewingAllNotifications(false);
                setModalVisible(true);
              }}
            >
              <FontAwesome5 name="bell" size={22} color="#CBD5E1" />
              {cantidadNotificaciones > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cantidadNotificaciones > 9 ? "9+" : cantidadNotificaciones}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={() => navigation.navigate("Perfil")}
            >
              {userInfo.photoURL ? (
                <Image source={{ uri: userInfo.photoURL }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profileInitial}>
                    {userInfo.firstName ? userInfo.firstName[0] : "U"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

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
            <View style={styles.modalHandle}></View>

            <Text style={styles.modalTitle}>
              {viewingAllNotifications
                ? "Todas las Notificaciones"
                : "Notificaciones Recientes"}
            </Text>

            {loading ? (
              <ActivityIndicator
                size="large"
                color="#3B82F6"
                style={styles.loadingIndicator}
              />
            ) : (
              <>
                {(viewingAllNotifications ? allNotificaciones : notificaciones).length > 0 ? (
                  <FlatList
                    data={viewingAllNotifications ? allNotificaciones : notificaciones}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item.id}
                    style={styles.notificationList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyNotifications}>
                    <FontAwesome5 name="bell-slash" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyNotificationsText}>
                      No hay notificaciones recientes
                    </Text>
                  </View>
                )}
              </>
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

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setViewingAllNotifications(false);
              }}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <Animated.View style={[styles.welcomeCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.welcomeContent}>
              <FontAwesome5 name="shield-alt" size={28} color="#FFFFFF" style={styles.welcomeIcon} />
              <View>
                <Text style={styles.welcomeText}>Seguridad Ciudadana</Text>
                <Text style={styles.welcomeSubtext}>Reporta incidentes en tu zona</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.actionCardsContainer}>
          <Text style={styles.sectionTitle}>Acciones rápidas</Text>

          <View style={styles.actionCards}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Takephoto")}
            >
              <View style={[styles.actionIconBg, { backgroundColor: '#EF4444' }]}>
                <FontAwesome5 name="camera" size={22} color="#fff" />
              </View>
              <Text style={styles.actionCardText}>Nuevo Reporte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("Reportes")}
            >
              <View style={[styles.actionIconBg, { backgroundColor: '#10B981' }]}>
                <FontAwesome5 name="clipboard-list" size={22} color="#fff" />
              </View>
              <Text style={styles.actionCardText}>Mis Reportes</Text>
            </TouchableOpacity>

            {userInfo.role === "admin" && (
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("AdminScreen")}
              >
                <View style={[styles.actionIconBg, { backgroundColor: '#8B5CF6' }]}>
                  <FontAwesome5 name="user-shield" size={22} color="#fff" />
                </View>
                <Text style={styles.actionCardText}>Panel Admin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.recentReportsContainer}>
          <Text style={styles.sectionTitle}>Reportes recientes</Text>

          {reportes.length > 0 ? (
            <FlatList
              data={reportes.slice(0, 3)}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentReportsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.recentReportCard}
                  onPress={() => navigation.navigate("ReporteDetalle", { reportId: item.id })}
                >
                  <View style={[styles.reportTypeTag, { backgroundColor: getTipoColor(item.tipo || "General") }]}>
                    <FontAwesome5 name={getTipoIcon(item.tipo || "General")} size={12} color="#fff" />
                    <Text style={styles.reportTypeText}>{item.tipo || "General"}</Text>
                  </View>

                  <Text style={styles.recentReportTitle} numberOfLines={2}>
                    {item.descripcion ? item.descripcion.substring(0, 60) : "Sin descripción"}
                    {item.descripcion && item.descripcion.length > 60 ? "..." : ""}
                  </Text>

                  <View style={styles.recentReportFooter}>
                    <Text style={styles.recentReportLocation}>
                      <FontAwesome5 name="map-marker-alt" size={10} color="#64748B" /> {item.ubicacion || "No especificada"}
                    </Text>
                    <Text style={styles.recentReportTime}>{formatTimestamp(item.creadoEn)}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyReportsContainer}>
              <FontAwesome5 name="clipboard" size={40} color="#CBD5E1" />
              <Text style={styles.emptyReportsText}>No hay reportes recientes</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    paddingTop: 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 3,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationBell: {
    marginRight: 15,
    padding: 8,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#3B82F6",
  },
  profileImage: {
    width: 40,
    height: 40,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  welcomeGradient: {
    borderRadius: 16,
    padding: 20,
  },
  welcomeContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIcon: {
    marginRight: 15,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  actionCardsContainer: {
    marginBottom: 24,
  },
  actionCards: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "30%",
    alignItems: "center",
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionCardText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
    textAlign: "center",
  },
  recentReportsContainer: {
    marginBottom: 20,
  },
  recentReportsList: {
    paddingRight: 20,
  },
  recentReportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: 230,
    marginRight: 15,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  reportTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 30,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  reportTypeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  recentReportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  recentReportFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentReportLocation: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  recentReportTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  emptyReportsContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 30,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  emptyReportsText: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 10,
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    height: "80%",
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#CBD5E1",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    textAlign: "center",
  },
  notificationList: {
    maxHeight: "70%",
  },
  notificationItem: {
    flexDirection: "row",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  notificationIconContainer: {
    marginRight: 16,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  newNotificationItem: {
    backgroundColor: "#F0F9FF",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
  },
  newBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  newBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  notificationBody: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notificationLocation: {
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
  },
  emptyNotifications: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyNotificationsText: {
    marginTop: 16,
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
  },
  loadingIndicator: {
    padding: 20,
  },
  viewAllButton: {
    marginTop: 20,
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  viewAllButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
});