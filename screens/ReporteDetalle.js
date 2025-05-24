import { useEffect, useState, useContext } from "react";
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
import { ThemeContext } from "../src/context/ThemeContext";

export default function ReporteDetalle({ navigation }) {
  const route = useRoute();
  const { reportId } = route.params;

  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Contexto de tema global
  const { theme } = useContext(ThemeContext);
  const themeStyles = theme === "light" ? lightStyles : darkStyles;

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
      <View style={themeStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3F51B5" />
        <Text style={themeStyles.loadingText}>Cargando reporte...</Text>
      </View>
    );
  }

  if (!reporte) {
    return (
      <View style={themeStyles.errorContainer}>
        <Text style={themeStyles.errorText}>No se encontró el reporte.</Text>
      </View>
    );
  }

  const imagenes =
    reporte.imagenesUrls || (reporte.imagenUrl ? [reporte.imagenUrl] : []);

  return (
    <>
      <ScrollView contentContainerStyle={themeStyles.container}>
        <View style={themeStyles.headerRow}>
          <TouchableOpacity
            style={themeStyles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="arrow-back"
              size={28}
              color={theme === "light" ? "#1E293B" : "#fff"}
            />
          </TouchableOpacity>
          <Text style={themeStyles.headerTitle}>Detalle del Reporte</Text>
        </View>

        {imagenes.map((url, index) => (
          <Image
            key={index}
            source={{ uri: url }}
            style={themeStyles.imagen}
            resizeMode="cover"
          />
        ))}

        <Text style={themeStyles.descripcion}>
          {reporte.descripcion || "Sin descripción"}
        </Text>

        {reporte.latitud && reporte.longitud ? (
          <View style={themeStyles.mapContainer}>
            <MapView
              style={themeStyles.mapa}
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
              style={themeStyles.mapButton}
              onPress={abrirEnGoogleMaps}
            >
              <Text style={themeStyles.mapButtonText}>Ver en google maps</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={themeStyles.ubicacion}>Ubicación no disponible</Text>
        )}

        <Text style={themeStyles.fecha}>
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

// Estilos para tema claro
const lightStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F1F5F9",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "bold",
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
  mapContainer: {
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
  ubicacion: {
    color: "#64748B",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  fecha: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 16,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerBackButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
});

// Estilos para tema oscuro
const darkStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    marginTop: 10,
    color: "#bbb",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "bold",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
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
    color: "#fff",
    marginBottom: 16,
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapa: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  mapButton: {
    backgroundColor: "#2563EB",
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
  ubicacion: {
    color: "#bbb",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  fecha: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 16,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerBackButton: {
    marginRight: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
});
