import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import TakePhotoAndUpload from "./screens/TakePhotoAndUpload";
import ReportListScreen from "./screens/ReportListScreen";
import ReporteDetalle from "./screens/ReporteDetalle"; // ✅ Asegúrate que la ruta y nombre del archivo sea correcto

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Takephoto"
          component={TakePhotoAndUpload}
        />
        <Stack.Screen
          name="Reportes"
          component={ReportListScreen}
        />
        <Stack.Screen
          name="ReporteDetalle"
          component={ReporteDetalle}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
