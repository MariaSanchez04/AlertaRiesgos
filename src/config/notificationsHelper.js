import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function configurarNotificaciones() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    console.log("Permiso de notificaciones denegado.");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reportes", {
      name: "Reportes",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
  }
}

export async function mostrarNotificacion(titulo, cuerpo) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
      sound: "default",
    },
    trigger: null, // inmediata
  });
}
