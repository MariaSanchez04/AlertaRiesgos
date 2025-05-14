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
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { db, auth, getUserData } from "../src/config/firebaseConfig";
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
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
              {imagenes.length > 0 && (
                <TouchableOpacity onPress={() => openImageModal(imagenes, 0)}>
                  <Image
                    source={{ uri: imagenes[0] }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  {imagenes.length > 1 && (
                    <Text style={styles.moreImagesText}>Ver más imágenes</Text>
                  )}
                </TouchableOpacity>
              )}

              <Text style={styles.descripcion}>{item.descripcion}</Text>

              {userRole === "admin" && (
                <View style={{ marginTop: 10 }}>
                  <Text style={{ fontSize: 14, color: "#555" }}>
                    Subido por: {item.correoUsuario || "Correo no disponible"}
                  </Text>
                </View>
              )}

              {userRole === "admin" && (
                <TouchableOpacity
                  style={{ marginTop: 10, alignSelf: "flex-end" }}
                  onPress={() => openEditModal(item)}
                >
                  <Text style={{ color: "blue" }}>Editar</Text>
                </TouchableOpacity>
              )}

              {/* Mostrar botón de eliminar solo si el usuario es admin */}
              {userRole === "admin" && (
                <TouchableOpacity
                  style={{ marginTop: 10, alignSelf: "flex-end" }}
                  onPress={() =>
                    Alert.alert(
                      "Confirmar eliminación",
                      `¿Estás seguro de que deseas eliminar este reporte?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        { text: "Eliminar", onPress: () => eliminarReporte(item.id) },
                      ]
                    )
                  }
                >
                  <Text style={{ color: "red" }}>Eliminar</Text>
                </TouchableOpacity>
              )}

              {item.latitud && item.longitud ? (
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
              ) : (
                <Text style={styles.locationText}>Ubicación no disponible</Text>
              )}

              <Text style={styles.fechaTexto}>
                {item.creadoEn
                  ? `Publicado el ${moment(item.creadoEn.toDate()).format(
                    "DD/MM/YYYY hh:mm A"
                  )}`
                  : "Fecha no disponible"}
              </Text>
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
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
  },
  loading: {
    marginTop: 50,
  },
  noReports: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 18,
    color: "gray",
  },
  listContainer: {
    paddingBottom: 16,
  },
  reportCard: {
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  moreImagesText: {
    color: "blue",
    textAlign: "center",
    marginTop: 5,
    fontSize: 14,
  },
  descripcion: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  fechaTexto: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  map: {
    width: "100%",
    height: 150,
    marginTop: 10,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    width: 350,
    height: 350,
    borderRadius: 10,
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    borderRadius: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
  },
  editModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  editModalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  editInput: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: "top",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 15,
  },
  cancelButton: {
    backgroundColor: "#888",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 8,
  },
});
