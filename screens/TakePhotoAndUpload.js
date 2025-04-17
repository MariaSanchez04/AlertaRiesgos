import { useState, useEffect } from "react";
import { View, Text, Button, Image, TextInput, ActivityIndicator, StyleSheet, Alert, ScrollView, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { db } from "../src/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import MapView, { Marker } from "react-native-maps";
import { useNavigation } from "@react-navigation/native";

export default function ReportScreen() {
  const [imagenes, setImagenes] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ubicacionError, setUbicacionError] = useState(null);

  const navigation = useNavigation();

  // Obtener ubicación actual
  const obtenerUbicacion = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setUbicacionError("Permiso de ubicación denegado");
      return;
    }

    try {
      let ubicacionActual = await Location.getCurrentPositionAsync({});
      setUbicacion(ubicacionActual.coords);
      setUbicacionError(null); // Reseteamos el error si la ubicación se obtiene correctamente
    } catch (error) {
      setUbicacionError("Error al obtener la ubicación");
    }
  };

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  // Tomar una foto con la cámara
  const tomarFoto = async () => {
    let resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!resultado.canceled) {
      setImagenes([...imagenes, resultado.assets[0]]);
    }
  };

  // Seleccionar múltiples imágenes desde la galería
  const seleccionarImagenes = async () => {
    let resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
      selectionLimit: 5,
      allowsMultipleSelection: true,
    });

    if (!resultado.canceled) {
      setImagenes([...imagenes, ...resultado.assets]);
    }
  };

  // Eliminar una imagen seleccionada
  const eliminarImagen = (uri) => {
    setImagenes(imagenes.filter((img) => img.uri !== uri));
  };

  // Subir reporte con imágenes a Cloudinary
  const subirReporte = async () => {
    if (imagenes.length === 0 || !ubicacion || !descripcion) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const urlsImagenes = [];

      // Convertir las imágenes a Base64 y subirlas a Cloudinary
      for (let imagen of imagenes) {
        const base64 = await FileSystem.readAsStringAsync(imagen.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Crear FormData para subir a Cloudinary
        const formData = new FormData();
        formData.append("file", `data:image/jpeg;base64,${base64}`);
        formData.append("upload_preset", "reportes");
        formData.append("folder", "reportes");

        // Subida de imagen a Cloudinary
        const respuesta = await fetch("https://api.cloudinary.com/v1_1/dd3y0fvce/image/upload", {
          method: "POST",
          body: formData,
        });

        if (!respuesta.ok) {
          const errorData = await respuesta.json();
          throw new Error("Error al subir la imagen a Cloudinary.");
        }

        const datos = await respuesta.json();
        if (datos.secure_url) {
          urlsImagenes.push(datos.secure_url);
        }
      }

      // Guardar los datos en Firestore con las URLs de Cloudinary
      await addDoc(collection(db, "reportes"), {
        imagenesUrls: urlsImagenes,
        descripcion,
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
        creadoEn: serverTimestamp(),
      });

      Alert.alert("Éxito", "Reporte enviado con éxito");
      setImagenes([]);
      setDescripcion("");
      setUbicacion(null);

      navigation.navigate('Reportes'); // Navegar a la pantalla de reportes
    } catch (error) {
      console.error("Error subiendo el reporte:", error);
      Alert.alert("Error", `Error al subir el reporte: ${error.message}`);
    }

    setCargando(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Descripción del Problema</Text>
      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Escribe aquí..."
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={tomarFoto} disabled={cargando}>
        <Text style={styles.buttonText}>📸 Tomar Foto</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={seleccionarImagenes} disabled={cargando}>
        <Text style={styles.buttonText}>Seleccionar Imágenes</Text>
      </TouchableOpacity>

      <ScrollView horizontal={true}>
        {imagenes.map((imagen, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image source={{ uri: imagen.uri }} style={styles.image} />
            <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarImagen(imagen.uri)}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.locationLabel}>Ubicación:</Text>
      {ubicacionError && <Text style={styles.errorText}>{ubicacionError}</Text>}

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

      <TouchableOpacity style={styles.submitButton} onPress={subirReporte} disabled={cargando}>
        <Text style={styles.submitButtonText}>Enviar Reporte</Text>
      </TouchableOpacity>

      {cargando && <ActivityIndicator size="large" color="#3498db" style={styles.loadingIndicator} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    margin: 5,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  deleteButtonText: {
    color: "#fff",
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
  },
  map: {
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: "#888",
  },
  submitButton: {
    backgroundColor: "#2ecc71",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingIndicator: {
    marginTop: 20,
  },
});
