import React, { useEffect, useState } from "react";
import { View, Text, Button, Alert } from "react-native";
import { auth } from "../config/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

const VerifyEmailScreen = ({ navigation }) => {
  const [emailVerified, setEmailVerified] = useState(auth.currentUser?.emailVerified);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        setEmailVerified(user.emailVerified);
        if (user.emailVerified) {
          Alert.alert("¡Correo verificado!", "Ahora puedes iniciar sesión.");
          navigation.replace("LoginScreen");
        }
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <View>
      <Text>Verifica tu email</Text>
      <Text>Por favor, revisa tu bandeja de entrada.</Text>
      <Button title="Reenviar Correo" onPress={() => sendEmailVerification(auth.currentUser)} />
      <Button title="Ya verifiqué" onPress={() => navigation.navigate("LoginScreen")} />
    </View>
  );
};

export default VerifyEmailScreen;
