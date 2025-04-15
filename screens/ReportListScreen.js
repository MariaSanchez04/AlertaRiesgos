import { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from "react-native";
import { db } from "../src/config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function ReportListScreen() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerReportes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "reportes"));
        const data = querySnapshot.docs.map(doc => ({
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

  if (cargando) {
    return <ActivityIndicator size="large" color="blue" style={styles.loading} />;
  }

  if (reportes.length === 0) {
    return <Text style={styles.noReports}>No hay reportes todavía.</Text>;
  }

  return (
    <FlatList
      data={reportes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      renderItem={({ item }) => (
        <View style={styles.reportCard}>
          <Image source={{ uri: item.imagenUrl }} style={styles.image} resizeMode="cover" />
          <Text style={styles.descripcion}>{item.descripcion}</Text>
          <Text style={styles.locationText}>
            Ubicación:{" "}
            {item.latitud && item.longitud
              ? `${item.latitud.toFixed(5)}, ${item.longitud.toFixed(5)}`
              : "Ubicación no disponible"}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
    padding: 16,
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
  descripcion: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  locationText: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
});
