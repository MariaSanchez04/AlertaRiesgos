import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { db } from "../src/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Asegúrate de importar serverTimestamp
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import {
  configurarNotificaciones,
  mostrarNotificacion,
} from "../src/config/notificationsHelper"; // Importa el helper

const screenWidth = Dimensions.get("window").width;

export default function ReportScreen() {
  const [imagenes, setImagenes] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  const navigation = useNavigation();

  const obtenerUbicacion = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setUbicacionError("Permiso de ubicación denegado");
      return;
    }

    try {
      let ubicacionActual = await Location.getCurrentPositionAsync({});
      setUbicacion(ubicacionActual.coords);
      setUbicacionError(null);
    } catch (error) {
      setUbicacionError("Error al obtener la ubicación");
    }
  };

  useEffect(() => {
    obtenerUbicacion();
    configurarNotificaciones(); // Configura notificaciones al inicio
  }, []);

  const tomarFoto = async () => {
    let resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!resultado.canceled) {
      setImagenes([...imagenes, resultado.assets[0]]);
    }
  };

  const seleccionarImagenes = async () => {
    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 0.8,
      selectionLimit: 5,
      allowsMultipleSelection: true,
    });

    if (!resultado.canceled) {
      setImagenes([...imagenes, ...resultado.assets]);
    }
  };

  const eliminarImagen = (uri) => {
    setImagenes(imagenes.filter((img) => img.uri !== uri));
  };

  const subirReporte = async () => {
    if (imagenes.length === 0 || !ubicacion || !descripcion) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const urlsImagenes = [];

      for (let imagen of imagenes) {
        const base64 = await FileSystem.readAsStringAsync(imagen.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const formData = new FormData();
        formData.append("file", `data:image/jpeg;base64,${base64}`);
        formData.append("upload_preset", "reportes");
        formData.append("folder", "reportes");

        const respuesta = await fetch(
          "https://api.cloudinary.com/v1_1/dd3y0fvce/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!respuesta.ok) {
          const errorData = await respuesta.json();
          throw new Error("Error al subir la imagen a Cloudinary.");
        }

        const datos = await respuesta.json();
        if (datos.secure_url) {
          urlsImagenes.push(datos.secure_url);
        }
      }

      // Verificar si los valores de latitud y longitud son correctos antes de agregar el reporte
      if (!ubicacion.latitude || !ubicacion.longitude) {
        throw new Error("Ubicación no válida.");
      }

      // Agregar el reporte a la base de datos
      await addDoc(collection(db, "reportes"), {
        imagenesUrls: urlsImagenes,
        descripcion,
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
        creadoEn: serverTimestamp(), // Esto asegura que Firebase maneje el timestamp automáticamente
      });

      // Mostrar notificación local tras un reporte exitoso
      await mostrarNotificacion(
        "Nuevo reporte enviado",
        "Tu reporte fue enviado correctamente."
      );

      // Mostrar mensaje de éxito con una alerta
      Alert.alert(
        "Éxito",
        "Reporte enviado con éxito ✅",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Reportes"),
          },
        ],
        { cancelable: false }
      );

      // Reiniciar los campos del formulario
      setImagenes([]);
      setDescripcion("");
    } catch (error) {
      console.error("Error subiendo el reporte:", error);
      Alert.alert("Error", `Error al subir el reporte: ${error.message}`);
    }

    setCargando(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Descripción del Problema</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          placeholder="Escribe aquí..."
          style={styles.input}
          multiline={true}
          numberOfLines={4}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={tomarFoto}
          disabled={cargando}
        >
          <Text style={styles.buttonText}>📸 Tomar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={seleccionarImagenes}
          disabled={cargando}
        >
          <Text style={styles.buttonText}>Seleccionar Imágenes</Text>
        </TouchableOpacity>

        {imagenes.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.imagesTitle}>
              Imágenes seleccionadas ({imagenes.length})
            </Text>
            <ScrollView
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScrollContainer}
            >
              {imagenes.map((imagen, index) => (
                <View key={index} style={styles.imageContainer}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setImagenSeleccionada(imagen.uri)}
                  >
                    <Image
                      source={{ uri: imagen.uri }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => eliminarImagen(imagen.uri)}
                  >
                    <Text style={styles.deleteButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.locationLabel}>Ubicación:</Text>
        {ubicacionError && (
          <Text style={styles.errorText}>{ubicacionError}</Text>
        )}

        {ubicacion && !ubicacionError ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: ubicacion.latitude,
                longitude: ubicacion.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: ubicacion.latitude,
                  longitude: ubicacion.longitude,
                }}
                title="Ubicación del reporte"
              />
            </MapView>
          </View>
        ) : (
          <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!descripcion || !ubicacion || imagenes.length === 0) &&
              styles.submitButtonDisabled,
          ]}
          onPress={subirReporte}
          disabled={
            cargando || !descripcion || !ubicacion || imagenes.length === 0
          }
        >
          <Text style={styles.submitButtonText}>
            {cargando ? "Enviando..." : "Enviar Reporte"}
          </Text>
        </TouchableOpacity>

        {cargando && (
          <ActivityIndicator
            size="large"
            color="#3498db"
            style={styles.loadingIndicator}
          />
        )}
      </ScrollView>

      {/* Modal para visualizar la imagen seleccionada */}
      {imagenSeleccionada && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImagenSeleccionada(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Image
                source={{ uri: imagenSeleccionada }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setImagenSeleccionada(null)}
              >
                <Text style={styles.closeModalText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: 20,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#3498db",
    padding: 14,
    borderRadius: 8,
    marginBottom: 15,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imagesSection: {
    marginVertical: 15,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
    color: "#555",
  },
  imagesScrollContainer: {
    paddingBottom: 10,
  },
  imageContainer: {
    marginRight: 12,
    position: "relative",
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  deleteButtonText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalContent: {
    width: "90%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  modalImage: {
    width: "100%",
    height: 400,
    borderRadius: 8,
  },
  closeModalButton: {
    backgroundColor: "#3498db",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  closeModalText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  locationLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginVertical: 10,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  mapContainer: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  map: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    padding: 10,
  },
  submitButton: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  loadingIndicator: {
    marginTop: 20,
  },
});
