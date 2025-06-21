import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Linking } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { ThemeContext } from "../src/context/ThemeContext"; // Asegúrate de que la ruta sea correcta

export default function EmergenciaScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const themeStyles = theme === "light" ? stylesLight : stylesDark;

  return (
    <SafeAreaView style={themeStyles.container}>
      <View style={themeStyles.headerRow}>
        <TouchableOpacity style={themeStyles.headerBackButton} onPress={() => navigation.goBack()}>
          <FontAwesome5 name="arrow-left" size={22} color={themeStyles.headerTitle.color} />
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle}>Números de emergencia</Text>
      </View>
      <ScrollView>
        <Text style={[themeStyles.text, { marginTop: 18, fontWeight: "bold", textAlign: "left" }]}>
          Recomendaciones de uso:
        </Text>
        <View style={{ marginTop: 10 }}>
          <Text style={[themeStyles.text, { textAlign: "left" }]}>
            • Utiliza estos números solo en casos de emergencia reales.
          </Text>
          <Text style={[themeStyles.text, { textAlign: "left" }]}>
            • Mantén la calma al llamar y proporciona información clara y precisa.
          </Text>
          <Text style={[themeStyles.text, { textAlign: "left" }]}>
            • No realices llamadas falsas, podrías afectar a quienes realmente necesitan ayuda.
          </Text>
          <Text style={[themeStyles.text, { textAlign: "left" }]}>
            • Ten estos números siempre a la mano y compártelos con tu familia.
          </Text>
          <Text style={[themeStyles.text, { textAlign: "left" }]}>
            • Si no puedes comunicarte, busca ayuda con vecinos o autoridades cercanas.
          </Text>
        </View>
        <Text style={[themeStyles.text, { marginTop: 28, fontWeight: "bold", textAlign: "left" }]}>
          Números de emergencia (Colombia):
        </Text>
        <TouchableOpacity
          style={themeStyles.emergencyRow}
          onPress={() => Linking.openURL("tel:3134981179")}
        >
          <FontAwesome5 name="shield-alt" size={20} color="#2563EB" style={{ marginRight: 10 }} />
          <Text style={[themeStyles.text, { color: "#2563EB", textAlign: "left", marginTop: 0 }]}>
            Policía Nacional: 313 498 1179
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={themeStyles.emergencyRow}
          onPress={() => Linking.openURL("tel:3134981179")}
        >
          <FontAwesome5 name="fire-extinguisher" size={20} color="#EF4444" style={{ marginRight: 10 }} />
          <Text style={[themeStyles.text, { color: "#EF4444", textAlign: "left", marginTop: 0 }]}>
            Bomberos: 313 498 1179
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={themeStyles.emergencyRow}
          onPress={() => Linking.openURL("tel:3134981179")}
        >
          <FontAwesome5 name="ambulance" size={20} color="#10B981" style={{ marginRight: 10 }} />
          <Text style={[themeStyles.text, { color: "#10B981", textAlign: "left", marginTop: 0 }]}>
            Ambulancia: 313 498 1179
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const stylesLight = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 8,
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
  text: {
    fontSize: 16,
    color: "#334155",
    textAlign: "center",
    marginTop: 16,
  },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 10,
  },
});

const stylesDark = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    marginTop: 8,
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
  text: {
    fontSize: 16,
    color: "#bbb",
    textAlign: "center",
    marginTop: 16,
  },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginLeft: 10,
  },
});