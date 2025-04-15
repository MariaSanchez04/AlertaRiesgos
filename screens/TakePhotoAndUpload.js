import { useState, useEffect } from "react";
import { View, Text, Button, Image, TextInput, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system";
import { db } from "../src/config/firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import MapView, { Marker } from "react-native-maps"; // para importar el mapa

export default function ReportScreen() {
  const [imagen, setImagen] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);

  // función para tomar una foto
  const tomarFoto = async () => {
    let resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],//3,4 para vertical
      quality: 1,
    });

    if (!resultado.canceled) {
      setImagen(resultado.assets[0].uri);
    }
  };

  // Obtener ubicación actual
  const obtenerUbicacion = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permiso de ubicación denegado");
      return;
    }

    let ubicacionActual = await Location.getCurrentPositionAsync({});
    setUbicacion(ubicacionActual.coords);
  };

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  // subir reporte con imagen a Cloudinary
  const subirReporte = async () => {
    if (!imagen || !ubicacion || !descripcion) {
      alert("Por favor completa todos los campos.");
      return;
    }
    setCargando(true);

    try {
      //console.log("URI de la imagen antes de subir:", imagen); 

      // Convertir la imagen a Base64
      const base64 = await FileSystem.readAsStringAsync(imagen, {
        encoding: FileSystem.EncodingType.Base64,
      });

      //crear FormData para subir a Cloudinary
      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${base64}`);
      formData.append("upload_preset", "reportes"); // mi Upload Preset
      formData.append("folder", "reportes"); // la Carpeta en Cloudinary donde se guarda

      //subida de imagen a Cloudinary
      const respuesta = await fetch(
        "https://api.cloudinary.com/v1_1/dd3y0fvce/image/upload",//url de la apip de Cloudinary
        {
          method: "POST",
          body: formData,
        }
      );

      //Verificacion si la respuesta de Cloudinary es válida
      if (!respuesta.ok) {
        const errorData = await respuesta.json();
        console.error("Error en Cloudinary:", errorData);
        throw new Error("Error al subir la imagen a Cloudinary.");
      }

      const datos = await respuesta.json();
      console.log("Respuesta completa de Cloudinary:", datos);

      //confirmacion que la URL de la imagen existe
      if (!datos.secure_url) {
        throw new Error("Cloudinary no devolvió una URL de imagen.");
      }

      console.log("Cloudinary URL:", datos.secure_url);

      //Guardar datos en Firestore con la URL de Cloudinary
      await addDoc(collection(db, "reportes"), {
        imagenUrl: datos.secure_url,
        descripcion,
        latitud: ubicacion.latitude,
        longitud: ubicacion.longitude,
        creadoEn: serverTimestamp(),
      });

      alert("✅ Reporte enviado con éxito");
      setImagen(null);
      setDescripcion("");
      setUbicacion(null);
    } catch (error) {
      console.error("Error subiendo el reporte:", error);
      alert(`Error al subir el reporte: ${error.message}`);
    }
    setCargando(false);

  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Descripción del Problema</Text>
      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Escribe aquí..."
        style={{ borderWidth: 1, width: 300, padding: 10, marginVertical: 10 }}
      />

      <Button title="Tomar Foto" onPress={tomarFoto} />
      {imagen && <Image source={{ uri: imagen }} style={{ width: 200, height: 200, marginTop: 10 }} />}

      <Text>Ubicación:</Text>

      {ubicacion ? (
        <View style={{ width: 300, height: 200, marginVertical: 10 }}>
          <MapView
            style={{ flex: 1 }}
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
        <Text>Obteniendo ubicación...</Text>
      )}

      <Button title="Enviar Reporte" onPress={subirReporte} disabled={cargando} />
      {cargando && <ActivityIndicator size="large" color="blue" />}
    </View>
  );
}
