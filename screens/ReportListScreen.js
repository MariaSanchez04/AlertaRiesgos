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
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { db } from "../src/config/firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import moment from "moment";

export default function ReportListScreen() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
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

    obtenerReportes();
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
});
