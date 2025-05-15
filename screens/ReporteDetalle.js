import { useEffect, useState } from "react";
import {
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
      <ActivityIndicator size="large" color="blue" style={{ marginTop: 50 }} />
    );
  }

  if (!reporte) {
    return <Text style={styles.mensajeError}>No se encontró el reporte.</Text>;
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
    padding: 16,
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  imagen: {
    width: "100%",
    height: 250,
    borderRadius: 8,
    marginBottom: 10,
  },
  descripcion: {
    fontSize: 16,
    marginBottom: 10,
  },
  mapa: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  ubicacion: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
  },
  fecha: {
    fontSize: 14,
    color: "#666",
  },
  mensajeError: {
    marginTop: 50,
    textAlign: "center",
    fontSize: 16,
    color: "red",
  },
});
