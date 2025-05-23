import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/config/firebaseConfig";
import MapView, { Marker } from "react-native-maps";
import moment from "moment";
import { Ionicons } from "@expo/vector-icons";

export default function ReporteDetalle() {
  const route = useRoute();
  const { reportId } = route.params;

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);

  const abrirEnGoogleMaps = () => {
    if (reporte?.latitud && reporte?.longitud) {
      const url = `https://www.google.com/maps?q=${reporte.latitud},${reporte.longitud}`;
      Linking.openURL(url).catch((err) =>
        console.error("No se pudo abrir Google Maps:", err)
      );
    }
  };

  useEffect(() => {
    const obtenerReporte = async () => {
      try {
        const docRef = doc(db, "reportes", reportId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setReporte({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("El reporte no existe");
        }
      } catch (error) {
        console.error("Error al obtener el reporte:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerReporte();
  }, [reportId]);

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={styles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  if (!reporte) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se encontró el reporte.</Text>
      </View>
    );
  }

  const imagenes =
    reporte.imagenesUrls || (reporte.imagenUrl ? [reporte.imagenUrl] : []);

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>Detalle del Reporte</Text>

        {imagenes.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={styles.imagen}
            resizeMode="cover"
          />
        ))}

        <Text style={styles.descripcion}>
          {reporte.descripcion || "Sin descripción"}
        </Text>

        {reporte.latitud && reporte.longitud ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.mapa}
              initialRegion={{
                latitude: reporte.latitud,
                longitude: reporte.longitud,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: reporte.latitud,
                  longitude: reporte.longitud,
                }}
              />
            </MapView>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={abrirEnGoogleMaps}
            >
              <Text style={styles.mapButtonText}>Ver en google maps</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.ubicacion}>Ubicación no disponible</Text>
        )}

        <Text style={styles.fecha}>
          {reporte.creadoEn
            ? `Publicado el ${moment(reporte.creadoEn.toDate()).format(
                "DD/MM/YYYY hh:mm A"
              )}`
            : "Fecha no disponible"}
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F1F5F9",
    padding: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
    textAlign: "center",
  },
  imagen: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  descripcion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 16,
  },
  mapa: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  mapButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  mapButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  fecha: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 16,
    textAlign: "center",
  },
});
