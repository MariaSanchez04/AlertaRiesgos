import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { ThemeProvider } from "./src/context/ThemeContext";

import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import TakePhotoAndUpload from "./screens/TakePhotoAndUpload";
import ReportListScreen from "./screens/ReportListScreen";
import ReporteDetalle from "./screens/ReporteDetalle";
import AdminScreen from "./screens/AdminScreen";
import PerfilScreen from "./screens/PerfilScreen";
import ForgotPasswordScreen from "./screens/ForgotPassword";
import ChangePasswordScreen from "./screens/ChangePassword";

const Stack = createStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
    <NavigationContainer>
      <Stack.Navigator>
        {/* Pantalla de inicio de sesión */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Recuperar contraseña */}
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
          options={{ title: "Recuperar contraseña" , headerShown: false }}
        />

        {/* Cambiar contraseña para usuarios autenticados */}
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: "Cambiar contraseña" }}
        />

        {/* Registro */}
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />

        {/* Pantalla principal */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />

        {/* Tomar foto y subir */}
        <Stack.Screen
          name="Takephoto"
          component={TakePhotoAndUpload}
          options={{ title: "Tomar reporte" , headerShown: false }}
        />

        {/* Lista de reportes */}
        <Stack.Screen
          name="Reportes"
          component={ReportListScreen}
          options={{ title: "Lista de reportes" , headerShown: false }}
        />

        {/* Detalle de reporte */}
        <Stack.Screen
          name="ReporteDetalle"
          component={ReporteDetalle}
          options={{ title: "Detalle del reporte" , headerShown: false }}
        />

        {/* Panel de administrador */}
        <Stack.Screen
          name="AdminScreen"
          component={AdminScreen}
          options={{ headerShown: false }}
        />

        {/* Perfil de usuario */}
        <Stack.Screen
          name="Perfil"
          component={PerfilScreen}
          options={{ title: "Perfil del usuario", headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </ThemeProvider>
  );
}
