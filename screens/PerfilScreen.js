import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableHighlight,
    ActivityIndicator,
    Image,
    Alert,
    ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../src/config/firebaseConfig";
import { FontAwesome5 } from "@expo/vector-icons";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";

const PerfilScreen = ({ navigation }) => {
    const [userInfo, setUserInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        photoURL: "",
        role: "",
    });

    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const db = getFirestore();

    useEffect(() => {
        const fetchUserData = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserInfo({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        email: data.email || "",
                        photoURL: data.photoURL || "",
                        role: data.role || "",
                    });
                }
            }
        };
        fetchUserData();
    }, []);

    const requestPermission = async (permissionType) => {
        if (permissionType === "camera") {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permiso denegado",
                    "Se necesita permiso para acceder a la cámara",
                    [{ text: "OK" }]
                );
                return false;
            }
        } else {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permiso denegado",
                    "Se necesita permiso para acceder a la galería",
                    [{ text: "OK" }]
                );
                return false;
            }
        }
        return true;
    };

    const pickImage = async () => {
        const hasPermission = await requestPermission("media");
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            await uploadProfileImage(result.assets[0].uri);
        }
        setPhotoModalVisible(false);
    };

    const takePhoto = async () => {
        const hasPermission = await requestPermission("camera");
        if (!hasPermission) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            await uploadProfileImage(result.assets[0].uri);
        }
        setPhotoModalVisible(false);
    };

    const uploadProfileImage = async (uri) => {
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append("file", {
                uri,
                type: "image/jpeg",
                name: "profile.jpg",
            });
            formData.append("upload_preset", "reportes");

            const response = await fetch(
                "https://api.cloudinary.com/v1_1/dd3y0fvce/image/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!data.secure_url) {
                throw new Error("No se recibió la URL segura de la imagen");
            }

            const url = data.secure_url;

            // Actualizar Firestore
            const userId = auth.currentUser.uid;
            await updateDoc(doc(db, "users", userId), {
                photoURL: url,
            });

            setUserInfo((prev) => ({ ...prev, photoURL: url }));
            Alert.alert("Éxito", "Foto de perfil actualizada correctamente");
        } catch (error) {
            console.error("Error al subir imagen a Cloudinary:", error);
            Alert.alert("Error", "No se pudo subir la imagen. Intenta de nuevo.");
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome5 name="arrow-left" size={20} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mi Perfil</Text>
            </View>

            {/* Modal para seleccionar foto de perfil */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={photoModalVisible}
                onRequestClose={() => setPhotoModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.photoModalContainer}>
                        <Text style={styles.modalTitle}>Cambiar Foto de Perfil</Text>

                        <TouchableOpacity style={styles.photoOption} onPress={takePhoto}>
                            <FontAwesome5
                                name="camera"
                                size={24}
                                color="#2563eb"
                                style={styles.photoOptionIcon}
                            />
                            <Text style={styles.photoOptionText}>Tomar una foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.photoOption} onPress={pickImage}>
                            <FontAwesome5
                                name="image"
                                size={24}
                                color="#2563eb"
                                style={styles.photoOptionIcon}
                            />
                            <Text style={styles.photoOptionText}>Elegir de la galería</Text>
                        </TouchableOpacity>

                        <TouchableHighlight
                            style={styles.cancelButton}
                            onPress={() => setPhotoModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableHighlight>
                    </View>
                </View>
            </Modal>

            <View style={styles.profileContainer}>
                <TouchableOpacity
                    style={styles.profileImageContainer}
                    onPress={() => setPhotoModalVisible(true)}
                >
                    {uploadingPhoto ? (
                        <View style={styles.loadingImageContainer}>
                            <ActivityIndicator size="large" color="#2563eb" />
                        </View>
                    ) : userInfo.photoURL ? (
                        <Image
                            source={{ uri: userInfo.photoURL }}
                            style={styles.profileImage}
                        />
                    ) : (
                        <FontAwesome5 name="user-circle" size={100} color="#aaa" />
                    )}
                    <View style={styles.cameraIconOverlay}>
                        <FontAwesome5 name="camera" size={16} color="#fff" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={() => setPhotoModalVisible(true)}
                    disabled={uploadingPhoto}
                >
                    <Text style={styles.changePhotoText}>
                        {uploadingPhoto ? "Subiendo..." : "Cambiar foto"}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nombre completo</Text>
                    <Text style={styles.infoValue}>
                        {userInfo.firstName && userInfo.lastName
                            ? `${userInfo.firstName} ${userInfo.lastName}`
                            : "Nombre no disponible"}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Correo electrónico</Text>
                    <Text style={styles.infoValue}>
                        {userInfo.email || "Correo no disponible"}
                    </Text>
                </View>

                {userInfo.role === "admin" && (
                    <View style={styles.infoItem}>
                        <Text style={styles.infoLabel}>Rol</Text>
                        <Text style={styles.infoValue}>Administrador</Text>
                    </View>
                )}

            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => Alert.alert("Proximamente", "Esta función estará disponible pronto")}
                >
                    <FontAwesome5 name="user-edit" size={16} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Editar información</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginLeft: 15,
        color: "#334155",
    },
    profileContainer: {
        alignItems: "center",
        paddingVertical: 30,
        backgroundColor: "#fff",
        marginTop: 20,
        marginHorizontal: 20,
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    profileImageContainer: {
        position: "relative",
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 15,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    cameraIconOverlay: {
        position: "absolute",
        right: 0,
        bottom: 0,
        backgroundColor: "#2563eb",
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    loadingImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(0,0,0,0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    changePhotoButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 10,
    },
    changePhotoText: {
        color: "#fff",
        fontWeight: "bold",
    },
    infoContainer: {
        backgroundColor: "#fff",
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 15,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoItem: {
        marginBottom: 20,
    },
    infoLabel: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 6,
    },
    infoValue: {
        fontSize: 16,
        color: "#1f2937",
        fontWeight: "500",
    },
    buttonContainer: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 30,
    },
    editProfileButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    modalBackground: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    photoModalContainer: {
        backgroundColor: "white",
        padding: 20,
        borderRadius: 10,
        width: "80%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    photoOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    photoOptionIcon: {
        marginRight: 15,
    },
    photoOptionText: {
        fontSize: 16,
        color: "#333",
    },
    cancelButton: {
        marginTop: 15,
        backgroundColor: "#f3f4f6",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#333",
        fontWeight: "bold",
    },
});

export default PerfilScreen;