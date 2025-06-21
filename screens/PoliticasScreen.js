import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ThemeContext } from "../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";

export default function PoliticasScreen({ navigation }) {
  const { theme } = useContext(ThemeContext);
  const themeStyles = theme === "light" ? stylesLight : stylesDark;

  return (
    <View style={themeStyles.container}>
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
        <Text style={themeStyles.headerTitle}>Políticas</Text>
      </View>
      <Text style={themeStyles.text}>
        Aquí encontrarás las políticas y la información relevante de la aplicación.
      </Text>
      <Text style={[themeStyles.text, { marginTop: 24, fontWeight: "bold" }]}>
        Recomendaciones de uso:
      </Text>
      <View style={{ marginTop: 10 }}>
        <Text style={[themeStyles.text, { textAlign: "left" }]}>
          • Utiliza la app solo para reportar incidentes reales.
        </Text>
        <Text style={[themeStyles.text, { textAlign: "left" }]}>
          • No compartas información falsa o engañosa.
        </Text>
        <Text style={[themeStyles.text, { textAlign: "left" }]}>
          • Respeta la privacidad de otras personas al tomar fotos o reportar.
        </Text>
        <Text style={[themeStyles.text, { textAlign: "left" }]}>
          • En caso de emergencia, comunícate también con las autoridades locales.
        </Text>
        <Text style={[themeStyles.text, { textAlign: "left" }]}>
          • En caso de un mal uso de la aplicación, se tomarán las medidas necesarias.
        </Text>
        <Text style={[themeStyles.text, { textAlign: "left" }]}>
          • Medidas como bloquear su cuenta o eliminar su cuenta.
        </Text>
      </View>
    </View>
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
});