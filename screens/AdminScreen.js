import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // Importar Picker
import { auth, db, getUserData } from "../src/config/firebaseConfig";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { ThemeContext } from "../src/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons"; // Agrega esta línea si usas Expo

export default function AdminScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);

  // Contexto de tema global
  const { theme } = useContext(ThemeContext);
  const themeStyles = theme === "light" ? lightStyles : darkStyles;

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Acceso denegado", "No hay sesión activa.");
          navigation.navigate("Login");
          return;
        }

        const userData = await getUserData(user.uid);
        if (userData?.role === "admin") {
          setIsAdmin(true);
          fetchUsers(); // Cargar los datos de los usuarios
        } else {
          Alert.alert(
            "Acceso denegado",
            "Solo los administradores pueden acceder."
          );
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error al verificar rol:", error);
        Alert.alert("Error", "No se pudo verificar el rol.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
      Alert.alert("Error", "No se pudieron cargar los datos de los usuarios.");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteDoc(doc(db, "users", userId)); // Eliminar el usuario de Firestore
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId)); // Actualizar la lista local
      Alert.alert("Éxito", "Usuario eliminado correctamente.");
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      Alert.alert("Error", "No se pudo eliminar el usuario.");
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditRole(user.role || "ciudadano");
    setIsBlocked(user.blocked || false); // Setea el estado del bloqueo
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedUser(null);
    setEditFirstName("");
    setEditLastName("");
    setEditRole("");
    setIsBlocked(false); // Reinicia el estado del bloqueo
  };

  const saveChanges = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        firstName: editFirstName,
        lastName: editLastName,
        role: editRole,
        blocked: isBlocked, // Se incluye el estado de bloqueo
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? {
                ...user,
                firstName: editFirstName,
                lastName: editLastName,
                role: editRole,
                blocked: isBlocked,
              }
            : user
        )
      );

      Alert.alert("Éxito", "Usuario actualizado correctamente.");
      closeEditModal();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      Alert.alert("Error", "No se pudo actualizar el usuario.");
    }
  };

  if (loading) {
    return (
      <View style={themeStyles.center}>
        <ActivityIndicator size="large" color="#0370b7" />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <View style={themeStyles.container}>
      <View style={themeStyles.headerRow}>
        <TouchableOpacity
          style={themeStyles.headerBackButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons
            name="arrow-back"
            size={28}
            color={theme === "light" ? "#1E293B" : "#fff"} // ← Cambia a blanco en modo oscuro
          />
        </TouchableOpacity>
        <Text style={themeStyles.headerTitle}>Panel de Administración</Text>
      </View>
      <Text style={themeStyles.text}>Lista de usuarios registrados:</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={themeStyles.userItem}>
            <Text style={themeStyles.userText}>
              <Text style={themeStyles.boldText}>Nombre:</Text> {item.firstName}{" "}
              {item.lastName}
            </Text>
            <Text style={themeStyles.userText}>
              <Text style={themeStyles.boldText}>Correo:</Text> {item.email}
            </Text>
            <Text style={themeStyles.userText}>
              <Text style={themeStyles.boldText}>Rol:</Text> {item.role}
            </Text>
            <Text style={themeStyles.userText}>
              <Text style={themeStyles.boldText}>Estado:</Text>{" "}
              {item.blocked ? "Bloqueado" : "Activo"}
            </Text>
            <View style={themeStyles.actionRow}>
              <TouchableOpacity
                style={themeStyles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={themeStyles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={themeStyles.deleteButton}
                onPress={() =>
                  Alert.alert(
                    "Confirmar eliminación",
                    `¿Estás seguro de que deseas eliminar a ${item.firstName} ${item.lastName}?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Eliminar", onPress: () => deleteUser(item.id) },
                    ]
                  )
                }
              >
                <Text style={themeStyles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal de edición */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
      >
        <View style={themeStyles.heroModalOverlay}>
          <View style={themeStyles.heroModalContent}>
            <View style={themeStyles.heroModalHeader}>
              <Text style={themeStyles.heroModalTitle}>Editar Usuario</Text>
            </View>
            <View style={themeStyles.heroModalBody}>
              <TextInput
                style={themeStyles.input}
                placeholder="Nombre"
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholderTextColor={theme === "light" ? "#94A3B8" : "#bbb"}
              />
              <TextInput
                style={themeStyles.input}
                placeholder="Apellido"
                value={editLastName}
                onChangeText={setEditLastName}
                placeholderTextColor={theme === "light" ? "#94A3B8" : "#bbb"}
              />
              <Text style={themeStyles.label}>Rol</Text>
              <Picker
                selectedValue={editRole}
                onValueChange={(itemValue) => setEditRole(itemValue)}
                style={themeStyles.picker}
                dropdownIconColor={theme === "light" ? "#1E293B" : "#fff"}
              >
                <Picker.Item label="Ciudadano" value="ciudadano" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
              <View style={themeStyles.blockContainer}>
                <Text style={themeStyles.label}>Bloquear Usuario</Text>
                <Picker
                  selectedValue={isBlocked ? "bloqueado" : "activo"}
                  onValueChange={(itemValue) =>
                    setIsBlocked(itemValue === "bloqueado")
                  }
                  style={themeStyles.picker}
                  dropdownIconColor={theme === "light" ? "#1E293B" : "#fff"}
                >
                  <Picker.Item label="Activo" value="activo" />
                  <Picker.Item label="Bloqueado" value="bloqueado" />
                </Picker>
              </View>
            </View>
            <View style={themeStyles.heroModalFooter}>
              <TouchableOpacity
                style={[themeStyles.heroModalButton, themeStyles.heroModalButtonDanger]}
                onPress={closeEditModal}
              >
                <Text style={themeStyles.heroModalButtonDangerText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[themeStyles.heroModalButton, themeStyles.heroModalButtonPrimary]}
                onPress={saveChanges}
              >
                <Text style={themeStyles.heroModalButtonPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Estilos para tema claro
const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F1F5F9",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerBackButton: {
    marginRight: 10,
    padding: 4,
  },
  headerBackIcon: {
    fontSize: 28,
    color: "#1E293B",
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E293B",
  },
  text: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  userItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#475569",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 0,
    overflow: "hidden",
  },
  userText: {
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 2,
  },
  boldText: {
    fontWeight: "bold",
    color: "#2563EB",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 0,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  editButtonText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 2,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 0,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 2,
  },
  // Modal estilo HeroUI
  heroModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroModalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    paddingBottom: 0,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  heroModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F1F5F9",
  },
  heroModalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#1E293B",
  },
  heroModalBody: {
    padding: 20,
    backgroundColor: "#fff",
  },
  heroModalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 10,
  },
  heroModalButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  heroModalButtonDanger: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  heroModalButtonDangerText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },
  heroModalButtonPrimary: {
    backgroundColor: "#2563EB",
  },
  heroModalButtonPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#334155",
  },
  picker: {
    height: 50,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
  },
  blockContainer: {
    marginBottom: 15,
  },
});

// Estilos para tema oscuro
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerBackButton: {
    marginRight: 10,
    padding: 4,
  },
  headerBackIcon: {
    fontSize: 28,
    color: "#3B82F6", // Azul para mejor contraste en oscuro
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  text: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  userItem: {
    backgroundColor: "#181C23", // Más oscuro y resaltado
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#222",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
    overflow: "hidden",
  },
  userText: {
    fontSize: 15,
    color: "#fff",
    marginBottom: 2,
  },
  boldText: {
    fontWeight: "bold",
    color: "#2563EB",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 0,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  editButtonText: {
    color: "#3B82F6",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 2,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 0,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 2,
  },
  // Modal estilo HeroUI
  heroModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroModalContent: {
    width: "90%",
    backgroundColor: "#181C23", // Más oscuro y consistente con las cards
    borderRadius: 18,
    overflow: "hidden",
    paddingBottom: 0,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  heroModalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    backgroundColor: "#222",
  },
  heroModalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#fff",
  },
  heroModalBody: {
    padding: 20,
    backgroundColor: "#181C23", // Igual que el modalContent
  },
  heroModalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    backgroundColor: "#222",
    borderTopWidth: 1,
    borderTopColor: "#222",
    gap: 10,
  },
  heroModalButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  heroModalButtonDanger: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  heroModalButtonDangerText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 16,
  },
  heroModalButtonPrimary: {
    backgroundColor: "#2563EB",
  },
  heroModalButtonPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: "#fff",
    backgroundColor: "#222",
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },
  picker: {
    height: 50,
    borderColor: "#333",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    color: "#fff",
    backgroundColor: "#222",
  },
  blockContainer: {
    marginBottom: 15,
  },
});
