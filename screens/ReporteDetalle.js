import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../src/config/firebaseConfig";
import MapView, { Marker } from "react-native-maps";
import moment from "moment";

export default function ReporteDetalle() {
  const route = useRoute();
  const { reportId } = route.params;

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);

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
          >
            <Marker
              coordinate={{
                latitude: reporte.latitud,
                longitude: reporte.longitud,
              }}
            />
          </MapView>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  errorText: {
    fontSize: 16,
    color: "red",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  imagen: {
    width: "100%",
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
  },
  descripcion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    lineHeight: 22,
    marginBottom: 16,
  },
  mapContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapa: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  ubicacion: {
    fontSize: 14,
    color: "#888",
    marginTop: 16,
    textAlign: "center",
  },
  fecha: {
    fontSize: 14,
    color: "#777",
    marginTop: 16,
    textAlign: "center",
  },
});
