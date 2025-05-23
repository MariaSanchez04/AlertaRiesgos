import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  db,
  auth,
  getUserData,
  actualizarReportes,
} from "../src/config/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function ReportListScreen() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [userRole, setUserRole] = useState(""); // Nuevo estado para el rol del usuario

  const navigation = useNavigation();

  useEffect(() => {
    const obtenerDatosUsuario = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userData = await getUserData(user.uid);
          setUserRole(userData?.role || ""); // Guardar el rol del usuario
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      }
    };

    const obtenerReportes = async () => {
      try {
        const reportesRef = collection(db, "reportes");
        const q = query(reportesRef, orderBy("creadoEn", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => {
          const reporte = doc.data();
          return {
            id: doc.id,
            ...reporte,
            correoUsuario: reporte.correoUsuario || "Correo no disponible", // Asignar valor predeterminado
          };
        });
        setReportes(data);
      } catch (error) {
        console.error("Error al obtener reportes:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosUsuario(); // Obtener el rol del usuario
    obtenerReportes(); // Obtener los reportes
  }, []);

  useEffect(() => {
    actualizarReportes();
  }, []);

  const handleSearch = (term) => setSearchTerm(term);

  const filteredReportes = reportes.filter((item) =>
    item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openImageModal = (imagenes, index = 0) => {
    setSelectedImages(imagenes);
    setSelectedImageIndex(index);
    setModalVisible(true);
  };

  const closeImageModal = () => setModalVisible(false);

  const openEditModal = (reporte) => {
    setSelectedReporte(reporte);
    setEditDescripcion(reporte.descripcion || "");
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedReporte(null);
    setEditDescripcion("");
  };

  const guardarCambios = async () => {
    if (!selectedReporte) return;

    try {
      const reporteRef = doc(db, "reportes", selectedReporte.id);
      await updateDoc(reporteRef, {
        descripcion: editDescripcion,
      });

      setReportes((prev) =>
        prev.map((r) =>
          r.id === selectedReporte.id
            ? { ...r, descripcion: editDescripcion }
            : r
        )
      );

      closeEditModal();
    } catch (error) {
      console.error("Error al actualizar reporte:", error);
    }
  };

  const eliminarReporte = async (reporteId) => {
    try {
      await deleteDoc(doc(db, "reportes", reporteId)); // Eliminar el reporte de Firestore
      setReportes((prev) => prev.filter((r) => r.id !== reporteId)); // Actualizar la lista local
      Alert.alert("Éxito", "Reporte eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar el reporte:", error);
      Alert.alert("Error", "No se pudo eliminar el reporte.");
    }
  };

  if (cargando) {
    return (
      <ActivityIndicator size="large" color="blue" style={styles.loading} />
    );
  }

  if (filteredReportes.length === 0) {
    return (
      <Text style={styles.noReports}>
        No hay reportes que coincidan con la búsqueda.
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="arrow-back" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes</Text>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por descripción"
        value={searchTerm}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredReportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const imagenes =
            item.imagenesUrls || (item.imagenUrl ? [item.imagenUrl] : []);
          return (
            <View style={styles.reportCard}>
              {/* Imagen principal con contador si hay más */}
              {imagenes.length > 0 && (
                <TouchableOpacity onPress={() => openImageModal(imagenes, 0)}>
                  <Image
                    source={{ uri: imagenes[0] }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {imagenes.length > 1 && (
                    <View style={styles.imageCountOverlay}>
                      <Ionicons name="images" size={20} color="#fff" />
                      <Text style={styles.imageCountText}>
                        +{imagenes.length - 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Descripción */}
              <Text style={styles.descripcion}>{item.descripcion}</Text>

              {/* Fecha y correo con íconos */}
              <View style={styles.infoRow}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color="#64748B"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.infoText}>
                  {item.creadoEn
                    ? moment(item.creadoEn.toDate()).format("DD/MM/YYYY hh:mm A")
                    : "Fecha no disponible"}
                </Text>
              </View>
              {userRole === "admin" && (
                <View style={styles.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#64748B"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.infoText}>{item.correoUsuario}</Text>
                </View>
              )}

              {/* Mapa y botón */}
              {item.latitud && item.longitud ? (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: item.latitud,
                      longitude: item.longitud,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: item.latitud,
                        longitude: item.longitud,
                      }}
                    />
                  </MapView>
                  <TouchableOpacity
                    style={styles.mapButton}
                    // Aquí podrías abrir un modal de mapa completo si lo implementas
                    onPress={() => {
                      const url = `https://www.google.com/maps?q=${item.latitud},${item.longitud}`;
                      Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.mapButtonText}>Ver en google maps</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.locationText}>Ubicación no disponible</Text>
              )}

              {/* Botones de acción */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={18} color="#2563EB" />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
                {userRole === "admin" && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      Alert.alert(
                        "Confirmar eliminación",
                        `¿Estás seguro de que deseas eliminar este reporte?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            onPress: () => eliminarReporte(item.id),
                          },
                        ]
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Modal de imágenes */}
      {modalVisible && (
        <Modal transparent={true} visible={modalVisible} animationType="fade">
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.verticalModalContent}>
              {selectedImages.map((url, index) => (
                <View key={index} style={styles.modalImageContainer}>
                  <Image
                    source={{ uri: url }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={closeImageModal}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.editModalContainer}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Editar descripción</Text>
            <TextInput
              style={styles.editInput}
              multiline
              value={editDescripcion}
              onChangeText={setEditDescripcion}
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.cancelButton}
              >
                <Text style={{ color: "white" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={guardarCambios}
                style={styles.saveButton}
              >
                <Text style={{ color: "white" }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerBackButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  searchInput: {
    height: 48,
    borderColor: "#E0E7EF",
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 16,
    marginBottom: 18,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#1E293B",
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  loading: {
    marginTop: 50,
  },
  noReports: {
    marginTop: 60,
    textAlign: "center",
    fontSize: 18,
    color: "#94A3B8",
    fontWeight: "500",
  },
  listContainer: {
    paddingBottom: 24,
  },
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 0,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 220,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 8,
    backgroundColor: "#E5E7EB",
  },
  imageCountOverlay: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "rgba(30,41,59,0.7)",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  imageCountText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 15,
  },
  descripcion: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 10,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  mapContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  map: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  mapButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    marginTop: 0,
  },
  mapButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 0,
  },
  editButtonText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 0,
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.85)",
  },
  verticalModalContent: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 5,
  },
  modalImageContainer: {
    marginBottom: 2,
    alignItems: "center",
  },
  modalImage: {
    width: 320,
    height: 320,
    borderRadius: 12,
    resizeMode: "contain",
    backgroundColor: "#E5E7EB",
  },
  closeButton: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },
  editModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(30,41,59,0.7)",
  },
  editModalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  editModalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1E293B",
  },
  editInput: {
    height: 90,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#1E293B",
    backgroundColor: "#F3F8FF",
    marginBottom: 16,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: "#64748B",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
});