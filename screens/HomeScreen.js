import React, { useState } from "react";
import { View, TextInput, Button, Text, StyleSheet, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { auth } from "../src/config/firebaseConfig";

const Tab = createBottomTabNavigator();

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a la Pantalla de Inicio</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuraciones</Text>
    </View>
  );
}

export default function App() {
  return (
    
      <Tab.Navigator>
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Configuración" component={SettingsScreen} />
      </Tab.Navigator>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
});
