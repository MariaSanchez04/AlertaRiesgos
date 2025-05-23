import { useState, useEffect } from "react";
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
  SafeAreaView,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { db } from "../src/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import {
  configurarNotificaciones,
  mostrarNotificacion,
} from "../src/config/notificationsHelper";
import { getAuth } from "firebase/auth";

const { width } = Dimensions.get("window");

export default function ReportScreen() {
  const [imagenes, setImagenes] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [step, setStep] = useState(1); // Para el flujo de pasos: 1=Descripción, 2=Imágenes, 3=Ubicación

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
    configurarNotificaciones();
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
      Alert.alert(
        "Campos incompletos",
        "Por favor completa todos los campos para enviar tu reporte."
      );
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
          throw new Error("Error al subir la imagen a Cloudinary.");
        }

        const datos = await respuesta.json();
        if (datos.secure_url) {
          urlsImagenes.push(datos.secure_url);
        }
      }

      const auth = getAuth();
      const user = auth.currentUser;
      const correoUsuario = user?.email || "Desconocido";

      if (!ubicacion.latitude || !ubicacion.longitude) {
        throw new Error("Ubicación no válida.");
      }

      await addDoc(collection(db, "reportes"), {
        imagenesUrls: urlsImagenes,
        descripcion,
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
        creadoEn: serverTimestamp(),
        correoUsuario: correoUsuario,
      });

      await mostrarNotificacion(
        "Nuevo reporte enviado",
        "Tu reporte fue enviado correctamente."
      );

      Alert.alert(
        "Reporte Enviado",
        "Tu reporte de seguridad ha sido enviado exitosamente. Gracias por tu colaboración.",
        [
          {
            text: "Ver reportes",
            onPress: () => navigation.navigate("Reportes"),
          },
        ],
        { cancelable: false }
      );

      setImagenes([]);
      setDescripcion("");
      setStep(1);
    } catch (error) {
      console.error("Error subiendo el reporte:", error);
      Alert.alert("Error", `No se pudo enviar el reporte: ${error.message}`);
    }

    setCargando(false);
  };

  const renderStepIndicator = () => {
    return (
      <View style={styles.stepIndicator}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[styles.stepCircle, step >= 1 && styles.activeStepCircle]}
          >
            <Text
              style={[styles.stepNumber, step >= 1 && styles.activeStepNumber]}
            >
              1
            </Text>
          </View>
          <Text style={[styles.stepText, step === 1 && styles.activeStepText]}>
            Descripción
          </Text>
        </View>

        <View style={styles.stepLine} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[styles.stepCircle, step >= 2 && styles.activeStepCircle]}
          >
            <Text
              style={[styles.stepNumber, step >= 2 && styles.activeStepNumber]}
            >
              2
            </Text>
          </View>
          <Text style={[styles.stepText, step === 2 && styles.activeStepText]}>
            Fotos
          </Text>
        </View>

        <View style={styles.stepLine} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[styles.stepCircle, step >= 3 && styles.activeStepCircle]}
          >
            <Text
              style={[styles.stepNumber, step >= 3 && styles.activeStepNumber]}
            >
              3
            </Text>
          </View>
          <Text style={[styles.stepText, step === 3 && styles.activeStepText]}>
            Ubicación
          </Text>
        </View>
      </View>
    );
  };

  const renderStep1 = () => {
    return (
      <View style={styles.stepContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>
            ¿Qué situación de seguridad quieres reportar?
          </Text>
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe el problema de seguridad que has observado..."
            style={styles.textArea}
            multiline={true}
            numberOfLines={6}
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.nextButton, !descripcion && styles.disabledButton]}
            onPress={() => (descripcion ? setStep(2) : null)}
            disabled={!descripcion}
          >
            <Text style={styles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep2 = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.mediaTitle}>Añade evidencia fotográfica</Text>

        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={styles.mediaButton}
            onPress={tomarFoto}
            disabled={cargando}
          >
            <Ionicons name="camera" size={28} color="#FFF" />
            <Text style={styles.mediaButtonText}>Tomar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mediaButton}
            onPress={seleccionarImagenes}
            disabled={cargando}
          >
            <Ionicons name="images" size={28} color="#FFF" />
            <Text style={styles.mediaButtonText}>Galería</Text>
          </TouchableOpacity>
        </View>

        {imagenes.length > 0 ? (
          <View style={styles.imagesContainer}>
            <Text style={styles.imagesCount}>
              {imagenes.length} imagen(es) seleccionada(s)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesScroll}
            >
              {imagenes.map((imagen, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setImagenSeleccionada(imagen.uri)}
                  >
                    <Image
                      source={{ uri: imagen.uri }}
                      style={styles.thumbnailImage}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteImageButton}
                    onPress={() => eliminarImagen(imagen.uri)}
                  >
                    <Ionicons name="close-circle" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.noImagesContainer}>
            <MaterialCommunityIcons
              name="file-image-outline"
              size={60}
              color="#CCCCCC"
            />
            <Text style={styles.noImagesText}>
              No has seleccionado imágenes
            </Text>
          </View>
        )}

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(1)}
          >
            <Ionicons name="arrow-back" size={20} color="#3F51B5" />
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              imagenes.length === 0 && styles.disabledButton,
            ]}
            onPress={() => (imagenes.length > 0 ? setStep(3) : null)}
            disabled={imagenes.length === 0}
          >
            <Text style={styles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep3 = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.locationTitle}>
          Confirma la ubicación del incidente
        </Text>

        {ubicacionError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={styles.errorText}>{ubicacionError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={obtenerUbicacion}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : ubicacion ? (
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: ubicacion.latitude,
                longitude: ubicacion.longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
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
            <View style={styles.mapOverlay}>
              <View style={styles.mapInfo}>
                <Ionicons name="location" size={18} color="#3F51B5" />
                <Text style={styles.locationInfo}>
                  Ubicación actual detectada
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.loadingLocation}>
            <ActivityIndicator size="large" color="#3F51B5" />
            <Text style={styles.loadingLocationText}>
              Obteniendo ubicación...
            </Text>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen del reporte</Text>

          <View style={styles.summaryItem}>
            <Ionicons name="document-text-outline" size={20} color="#555" />
            <Text style={styles.summaryLabel}>Descripción:</Text>
            <Text
              style={styles.summaryValue}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {descripcion.substring(0, 40)}
              {descripcion.length > 40 ? "..." : ""}
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="images-outline" size={20} color="#555" />
            <Text style={styles.summaryLabel}>Imágenes:</Text>
            <Text style={styles.summaryValue}>
              {imagenes.length} seleccionada(s)
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={styles.summaryLabel}>Ubicación:</Text>
            <Text style={styles.summaryValue}>
              {ubicacion ? "Detectada correctamente" : "Pendiente..."}
            </Text>
          </View>
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(2)}
          >
            <Ionicons name="arrow-back" size={20} color="#3F51B5" />
            <Text style={styles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!descripcion ||
                !ubicacion ||
                imagenes.length === 0 ||
                cargando) &&
                styles.disabledButton,
            ]}
            onPress={subirReporte}
            disabled={
              !descripcion || !ubicacion || imagenes.length === 0 || cargando
            }
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Enviar reporte</Text>
                <Ionicons name="send" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuevo Reporte</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Ayuda a mejorar la seguridad de tu comunidad
          </Text>
        </View>

        {renderStepIndicator()}

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Modal para visualizar la imagen seleccionada */}
        <Modal
          visible={imagenSeleccionada !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImagenSeleccionada(null)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setImagenSeleccionada(null)}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>

            <Image
              source={{ uri: imagenSeleccionada }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    // alignItems: "center", // Elimina esto para usar headerRow
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  headerBackButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "left",
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    textAlign: "left",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeStepCircle: {
    backgroundColor: "#3B82F6",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  activeStepNumber: {
    color: "#FFFFFF",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 4,
  },
  activeStepText: {
    color: "#3B82F6",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    fontSize: 16,
    color: "#1E293B",
    minHeight: 120,
    textAlignVertical: "top",
  },
  buttonContainer: {
    alignItems: "flex-end",
    marginTop: 16,
  },
  nextButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  mediaButton: {
    backgroundColor: "#2563EB",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.4,
    height: 100,
    borderRadius: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  imagesContainer: {
    marginBottom: 24,
  },
  imagesCount: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 12,
  },
  imagesScroll: {
    paddingRight: 16,
  },
  imageWrapper: {
    marginRight: 12,
    position: "relative",
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  noImagesContainer: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  noImagesText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 12,
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3B82F6",
    backgroundColor: "#F1F5F9",
  },
  backButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 16,
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#E53935",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#E53935",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mapInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInfo: {
    fontSize: 14,
    color: "#334155",
    marginLeft: 6,
  },
  loadingLocation: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingLocationText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 12,
  },
  summaryContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: "#1E293B",
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 8,
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
