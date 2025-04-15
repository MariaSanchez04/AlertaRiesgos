import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import HomeScreen from "./screens/HomeScreen";
import TakePhotoAndUpload from "./screens/TakePhotoAndUpload";
import ReportListScreen from "./screens/ReportListScreen";


const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Takephoto" component={TakePhotoAndUpload} />
        <Stack.Screen name="Reportes" component={ReportListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
