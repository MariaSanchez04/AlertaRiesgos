import { useState, useEffect, useContext } from "react";
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
import { ThemeContext } from "../src/context/ThemeContext"; // Importa el contexto de tema

const { width } = Dimensions.get("window");

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
    backgroundColor: "#3B82F6",
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
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "left",
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
    paddingHorizontal: 0,
    flexWrap: 'nowrap',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  activeStepCircle: {
    backgroundColor: "#3B82F6",
  },
  stepNumber: {
    color: "#64748B",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeStepNumber: {
    color: "#fff",
  },
  stepText: {
    marginLeft: 4,
    color: "#64748B",
    fontWeight: "600",
    fontSize: 13,
    flexShrink: 1,
  },
  activeStepText: {
    color: "#3B82F6",
  },
  stepLine: {
    width: 18,
    height: 2,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 2,
  },
  stepContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
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
    marginTop: 16,
    alignItems: "flex-end",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: "#CBD5E1",
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  mediaButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  mediaButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 5,
  },
  mediaButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 8,
  },
  imagesContainer: {
    marginBottom: 16,
  },
  imagesCount: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 12,
  },
  imagesScroll: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageWrapper: {
    position: "relative",
    marginRight: 12,
  },
  thumbnailImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  deleteImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 2,
    zIndex: 2,
  },
  noImagesContainer: {
    backgroundColor: "#F8FAFC",
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
    marginTop: 24,
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
    backgroundColor: "#fff",
  },
  backButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapWrapper: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mapInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInfo: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 6,
  },
  loadingLocation: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingLocationText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 12,
  },
  summaryContainer: {
    backgroundColor: "#F8FAFC",
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
    color: "#64748B",
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: "#1E293B",
    flex: 1,
    flexWrap: "wrap",
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeModalButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 6,
  },
  modalImage: {
    width: width - 40,
    height: width - 40,
    borderRadius: 16,
    marginTop: 60,
  },
});

export default function ReportScreen() {
  const [imagenes, setImagenes] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState(null);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [step, setStep] = useState(1);

  const navigation = useNavigation();

  const { theme } = useContext(ThemeContext);
  const themeStyles = theme === "light" ? lightStyles : darkStyles;

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
      <View style={themeStyles.stepIndicator}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              themeStyles.stepCircle,
              step >= 1 && themeStyles.activeStepCircle,
            ]}
          >
            <Text
              style={[
                themeStyles.stepNumber,
                step >= 1 && themeStyles.activeStepNumber,
              ]}
            >
              1
            </Text>
          </View>
          <Text style={[themeStyles.stepText, step === 1 && themeStyles.activeStepText]}>
            Descripción
          </Text>
        </View>

        <View style={themeStyles.stepLine} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              themeStyles.stepCircle,
              step >= 2 && themeStyles.activeStepCircle,
            ]}
          >
            <Text
              style={[
                themeStyles.stepNumber,
                step >= 2 && themeStyles.activeStepNumber,
              ]}
            >
              2
            </Text>
          </View>
          <Text style={[themeStyles.stepText, step === 2 && themeStyles.activeStepText]}>
            Fotos
          </Text>
        </View>

        <View style={themeStyles.stepLine} />

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={[
              themeStyles.stepCircle,
              step >= 3 && themeStyles.activeStepCircle,
            ]}
          >
            <Text
              style={[
                themeStyles.stepNumber,
                step >= 3 && themeStyles.activeStepNumber,
              ]}
            >
              3
            </Text>
          </View>
          <Text style={[themeStyles.stepText, step === 3 && themeStyles.activeStepText]}>
            Ubicación
          </Text>
        </View>
      </View>
    );
  };

  const renderStep1 = () => {
    return (
      <View style={themeStyles.stepContainer}>
        <View style={themeStyles.inputContainer}>
          <Text style={themeStyles.inputLabel}>
            ¿Qué situación de seguridad quieres reportar?
          </Text>
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe el problema de seguridad que has observado..."
            style={themeStyles.textArea}
            multiline={true}
            numberOfLines={6}
            placeholderTextColor={theme === "light" ? "#A0A0A0" : "#bbb"}
          />
        </View>

        <View style={themeStyles.buttonContainer}>
          <TouchableOpacity
            style={[
              themeStyles.nextButton,
              !descripcion && themeStyles.disabledButton,
            ]}
            onPress={() => (descripcion ? setStep(2) : null)}
            disabled={!descripcion}
          >
            <Text style={themeStyles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep2 = () => {
    return (
      <View style={themeStyles.stepContainer}>
        <Text style={themeStyles.mediaTitle}>Añade evidencia fotográfica</Text>

        <View style={themeStyles.mediaButtons}>
          <TouchableOpacity
            style={themeStyles.mediaButton}
            onPress={tomarFoto}
            disabled={cargando}
          >
            <Ionicons name="camera" size={28} color="#FFF" />
            <Text style={themeStyles.mediaButtonText}>Tomar foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themeStyles.mediaButton}
            onPress={seleccionarImagenes}
            disabled={cargando}
          >
            <Ionicons name="images" size={28} color="#FFF" />
            <Text style={themeStyles.mediaButtonText}>Galería</Text>
          </TouchableOpacity>
        </View>

        {imagenes.length > 0 ? (
          <View style={themeStyles.imagesContainer}>
            <Text style={themeStyles.imagesCount}>
              {imagenes.length} imagen(es) seleccionada(s)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={themeStyles.imagesScroll}
            >
              {imagenes.map((imagen, index) => (
                <View key={index} style={themeStyles.imageWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setImagenSeleccionada(imagen.uri)}
                  >
                    <Image
                      source={{ uri: imagen.uri }}
                      style={themeStyles.thumbnailImage}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={themeStyles.deleteImageButton}
                    onPress={() => eliminarImagen(imagen.uri)}
                  >
                    <Ionicons name="close-circle" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={themeStyles.noImagesContainer}>
            <MaterialCommunityIcons
              name="file-image-outline"
              size={60}
              color="#CCCCCC"
            />
            <Text style={themeStyles.noImagesText}>
              No has seleccionado imágenes
            </Text>
          </View>
        )}

        <View style={themeStyles.navigationButtons}>
          <TouchableOpacity
            style={themeStyles.backButton}
            onPress={() => setStep(1)}
          >
            <Ionicons name="arrow-back" size={20} color="#3F51B5" />
            <Text style={themeStyles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              themeStyles.nextButton,
              imagenes.length === 0 && themeStyles.disabledButton,
            ]}
            onPress={() => (imagenes.length > 0 ? setStep(3) : null)}
            disabled={imagenes.length === 0}
          >
            <Text style={themeStyles.nextButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStep3 = () => {
    return (
      <View style={themeStyles.stepContainer}>
        <Text style={themeStyles.locationTitle}>
          Confirma la ubicación del incidente
        </Text>

        {ubicacionError ? (
          <View style={themeStyles.errorContainer}>
            <Ionicons name="warning" size={24} color="#F44336" />
            <Text style={themeStyles.errorText}>{ubicacionError}</Text>
            <TouchableOpacity
              style={themeStyles.retryButton}
              onPress={obtenerUbicacion}
            >
              <Text style={themeStyles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : ubicacion ? (
          <View style={themeStyles.mapWrapper}>
            <MapView
              style={themeStyles.map}
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
            <View style={themeStyles.mapOverlay}>
              <View style={themeStyles.mapInfo}>
                <Ionicons name="location" size={18} color="#3F51B5" />
                <Text style={themeStyles.locationInfo}>
                  Ubicación actual detectada
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={themeStyles.loadingLocation}>
            <ActivityIndicator size="large" color="#3F51B5" />
            <Text style={themeStyles.loadingLocationText}>
              Obteniendo ubicación...
            </Text>
          </View>
        )}

        <View style={themeStyles.summaryContainer}>
          <Text style={themeStyles.summaryTitle}>Resumen del reporte</Text>

          <View style={themeStyles.summaryItem}>
            <Ionicons name="document-text-outline" size={20} color="#555" />
            <Text style={themeStyles.summaryLabel}>Descripción:</Text>
            <Text
              style={themeStyles.summaryValue}
              numberOfLines={3} // Permite hasta 3 líneas, puedes ajustar
              ellipsizeMode="tail"
            >
              {descripcion}
            </Text>
          </View>

          <View style={themeStyles.summaryItem}>
            <Ionicons name="images-outline" size={20} color="#555" />
            <Text style={themeStyles.summaryLabel}>Imágenes:</Text>
            <Text style={themeStyles.summaryValue}>
              {imagenes.length} seleccionada(s)
            </Text>
          </View>

          <View style={themeStyles.summaryItem}>
            <Ionicons name="location-outline" size={20} color="#555" />
            <Text style={themeStyles.summaryLabel}>Ubicación:</Text>
            <Text style={themeStyles.summaryValue}>
              {ubicacion ? "Detectada correctamente" : "Pendiente..."}
            </Text>
          </View>
        </View>

        <View style={themeStyles.navigationButtons}>
          <TouchableOpacity
            style={themeStyles.backButton}
            onPress={() => setStep(2)}
          >
            <Ionicons name="arrow-back" size={20} color="#3F51B5" />
            <Text style={themeStyles.backButtonText}>Atrás</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              themeStyles.submitButton,
              (!descripcion ||
                !ubicacion ||
                imagenes.length === 0 ||
                cargando) &&
              themeStyles.disabledButton,
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
                <Text style={themeStyles.submitButtonText}>Enviar reporte</Text>
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
    <SafeAreaView style={themeStyles.safeArea}>
      <StatusBar barStyle={theme === "light" ? "dark-content" : "light-content"} />

      <KeyboardAvoidingView
        style={themeStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={themeStyles.header}>
          <View style={themeStyles.headerRow}>
            <TouchableOpacity
              style={themeStyles.headerBackButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={themeStyles.headerTitle}>Nuevo Reporte</Text>
          </View>
          <Text style={themeStyles.headerSubtitle}>
            Ayuda a mejorar la seguridad de tu comunidad
          </Text>
        </View>

        {renderStepIndicator()}

        <ScrollView
          contentContainerStyle={themeStyles.scrollContainer}
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
          <View style={themeStyles.modalContainer}>
            <TouchableOpacity
              style={themeStyles.closeModalButton}
              onPress={() => setImagenSeleccionada(null)}
            >
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>

            <Image
              source={{ uri: imagenSeleccionada }}
              style={themeStyles.modalImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Estilos para tema claro
const lightStyles = StyleSheet.create({
  ...styles,
});

// Estilos para tema oscuro
const darkStyles = StyleSheet.create({
  ...styles,
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "left",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: "#222",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    fontSize: 16,
    color: "#fff",
    minHeight: 120,
    textAlignVertical: "top",
  },
  mediaTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  imagesCount: {
    fontSize: 14,
    color: "#bbb",
    marginBottom: 12,
  },
  noImagesContainer: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 24,
  },
  noImagesText: {
    fontSize: 16,
    color: "#bbb",
    marginTop: 12,
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
    backgroundColor: "#111",
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
    color: "#fff",
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: "#2d0707",
    borderRadius: 12,
    padding: 16,
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
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
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mapInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInfo: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 6,
  },
  loadingLocation: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingLocationText: {
    fontSize: 16,
    color: "#bbb",
    marginTop: 12,
  },
  summaryContainer: {
    backgroundColor: "#111",
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
    color: "#fff",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#bbb",
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: "#fff",
    flex: 1,
  },
});
