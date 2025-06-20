import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { ThemeContext } from "../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";

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
        <Text style={themeStyles.headerTitle}>Políticas e Información</Text>
      </View>
      <Text style={themeStyles.text}>
        Este es un texto de prueba para la pantalla de Políticas e Información de
        la aplicación.
      </Text>

      {/* Números de emergencia */}
      <View style={{ marginTop: 32 }}>
        <Text
          style={[themeStyles.text, { fontWeight: "bold", marginBottom: 8 }]}
        >
          Números de emergencia (Colombia):
        </Text>
        <TouchableOpacity
          style={themeStyles.emergencyRow}
          onPress={() => Linking.openURL("tel:3134981179")}
        >
          <FontAwesome5
            name="shield-alt"
            size={20}
            color="#2563EB"
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              themeStyles.text,
              { color: "#2563EB", textAlign: "left", marginTop: 0 },
            ]}
          >
            Policía Nacional: 313 498 1179
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={themeStyles.emergencyRow}
          onPress={() => Linking.openURL("tel:3134981179")}
        >
          <FontAwesome5
            name="fire-extinguisher"
            size={20}
            color="#EF4444"
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              themeStyles.text,
              { color: "#EF4444", textAlign: "left", marginTop: 0 },
            ]}
          >
            Bomberos: 313 498 1179
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={themeStyles.emergencyRow}
          onPress={() => Linking.openURL("tel:3134981179")}
        >
          <FontAwesome5
            name="ambulance"
            size={20}
            color="#10B981"
            style={{ marginRight: 10 }}
          />
          <Text
            style={[
              themeStyles.text,
              { color: "#10B981", textAlign: "left", marginTop: 0 },
            ]}
          >
            Ambulancia: 313 498 1179
          </Text>
        </TouchableOpacity>
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