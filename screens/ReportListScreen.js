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
  StatusBar,
  SafeAreaView,
  Dimensions,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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

const { width } = Dimensions.get("window");

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
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const obtenerDatosUsuario = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userData = await getUserData(user.uid);
          setUserRole(userData?.role || "");
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
            correoUsuario: reporte.correoUsuario || "Correo no disponible",
          };
        });
        setReportes(data);
      } catch (error) {
        console.error("Error al obtener reportes:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerDatosUsuario();
    obtenerReportes();
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
      Alert.alert("Éxito", "Reporte actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar reporte:", error);
      Alert.alert("Error", "No se pudo actualizar el reporte");
    }
  };

  const eliminarReporte = async (reporteId) => {
    try {
      await deleteDoc(doc(db, "reportes", reporteId));
      setReportes((prev) => prev.filter((r) => r.id !== reporteId));
      Alert.alert("Éxito", "Reporte eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el reporte:", error);
      Alert.alert("Error", "No se pudo eliminar el reporte");
    }
  };

  const renderHeader = () => {
    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes de Seguridad</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por descripción"
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={handleSearch}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </SafeAreaView>
    );
  }

  if (filteredReportes.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#888" />
          <Text style={styles.noReports}>
            No hay reportes que coincidan con la búsqueda.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#3F51B5" barStyle="light-content" />

      <FlatList
        data={filteredReportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
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
                    <View style={styles.moreImagesIndicator}>
                      <Ionicons name="images" size={18} color="#FFF" />
                      <Text style={styles.moreImagesText}>
                        +{imagenes.length - 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.reportContent}>
                <Text style={styles.descripcion}>{item.descripcion}</Text>

                <View style={styles.metaDataContainer}>
                  {item.creadoEn && (
                    <View style={styles.metaDataItem}>
                      <Ionicons name="time-outline" size={14} color="#777" />
                      <Text style={styles.metaDataText}>
                        {moment(item.creadoEn.toDate()).format("DD/MM/YYYY hh:mm A")}
                      </Text>
                    </View>
                  )}

                  {userRole === "admin" && (
                    <View style={styles.metaDataItem}>
                      <Ionicons name="person-outline" size={14} color="#777" />
                      <Text style={styles.metaDataText}>
                        {item.correoUsuario}
                      </Text>
                    </View>
                  )}
                </View>

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
                    <TouchableOpacity style={styles.mapButton}>
                      <Text style={styles.mapButtonText}>Ver en mapa completo</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noLocationContainer}>
                    <Ionicons name="location-off-outline" size={16} color="#888" />
                    <Text style={styles.locationText}>Ubicación no disponible</Text>
                  </View>
                )}

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={18} color="#3F51B5" />
                    <Text style={[styles.actionText, { color: "#3F51B5" }]}>Editar</Text>
                  </TouchableOpacity>

                  {userRole === "admin" && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        Alert.alert(
                          "Confirmar eliminación",
                          "¿Estás seguro de que deseas eliminar este reporte?",
                          [
                            { text: "Cancelar", style: "cancel" },
                            {
                              text: "Eliminar",
                              onPress: () => eliminarReporte(item.id),
                              style: "destructive",
                            },
                          ]
                        )
                      }
                    >
                      <Ionicons name="trash-outline" size={18} color="#F44336" />
                      <Text style={[styles.actionText, { color: "#F44336" }]}>Eliminar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Modal de imágenes */}
      {/* Modal de imágenes */}
      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeModalButton}
            onPress={closeImageModal}
          >
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>

          <ScrollView
            horizontal={true}
            pagingEnabled={true}
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalModalContent}
          >
            {selectedImages.map((url, index) => (
              <View key={index} style={styles.modalImageContainer}>
                <Image
                  source={{ uri: url }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {index + 1}/{selectedImages.length}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>


      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.editModalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar descripción</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.editInput}
              multiline
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              placeholder="Describe el reporte de seguridad"
            />

            <View style={styles.editButtons}>
              <TouchableOpacity
                onPress={closeEditModal}
                style={styles.cancelButton}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={guardarCambios}
                style={styles.saveButton}
              >
                <Text style={styles.buttonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 10,
    color: "#555",
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#F5F7FA",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  horizontalModalContent: {
    flex: 1,
  },
  modalImageContainer: {
    width: width,            // igual al ancho de pantalla
    height: "100%",          // ocupa todo el alto del modal
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: width,
    resizeMode: "contain",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  noReports: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 18,
    color: "#666",
    lineHeight: 24,
  },
  listContainer: {
    paddingBottom: 24,
  },
  reportCard: {
    margin: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
  },
  moreImagesIndicator: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  moreImagesText: {
    color: "#FFF",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  reportContent: {
    padding: 16,
  },
  descripcion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    lineHeight: 22,
  },
  metaDataContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  metaDataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metaDataText: {
    fontSize: 14,
    color: "#777",
    marginLeft: 4,
  },
  mapContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: 150,
    borderRadius: 12,
  },
  mapButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapButtonText: {
    fontSize: 12,
    color: "#3F51B5",
    fontWeight: "600",
  },
  noLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#888",
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
    padding: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
  },
  verticalModalContent: {
    flexGrow: 1,
  },
  modalImageContainer: {
    width: width,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width,
    height: width,
    resizeMode: "contain",
  },
  imageCounter: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  editModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  editModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  editInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 16,
    height: 120,
    fontSize: 16,
    color: "#333",
    textAlignVertical: "top",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: "#9E9E9E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: "#3F51B5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
});