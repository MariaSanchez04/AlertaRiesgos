import { useEffect, useState } from "react";
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0370b7" />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.headerBackIcon}>{"←"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
      </View>
      <Text style={styles.text}>Lista de usuarios registrados:</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userItem}>
            <Text style={styles.userText}>
              <Text style={styles.boldText}>Nombre:</Text> {item.firstName}{" "}
              {item.lastName}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.boldText}>Correo:</Text> {item.email}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.boldText}>Rol:</Text> {item.role}
            </Text>
            <Text style={styles.userText}>
              <Text style={styles.boldText}>Estado:</Text>{" "}
              {item.blocked ? "Bloqueado" : "Activo"}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
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
                <Text style={styles.deleteButtonText}>Eliminar</Text>
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
        <View style={styles.heroModalOverlay}>
          <View style={styles.heroModalContent}>
            <View style={styles.heroModalHeader}>
              <Text style={styles.heroModalTitle}>Editar Usuario</Text>
            </View>
            <View style={styles.heroModalBody}>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={editFirstName}
                onChangeText={setEditFirstName}
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={editLastName}
                onChangeText={setEditLastName}
                placeholderTextColor="#94A3B8"
              />
              <Text style={styles.label}>Rol</Text>
              <Picker
                selectedValue={editRole}
                onValueChange={(itemValue) => setEditRole(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Ciudadano" value="ciudadano" />
                <Picker.Item label="Admin" value="admin" />
              </Picker>
              <View style={styles.blockContainer}>
                <Text style={styles.label}>Bloquear Usuario</Text>
                <Picker
                  selectedValue={isBlocked ? "bloqueado" : "activo"}
                  onValueChange={(itemValue) =>
                    setIsBlocked(itemValue === "bloqueado")
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Activo" value="activo" />
                  <Picker.Item label="Bloqueado" value="bloqueado" />
                </Picker>
              </View>
            </View>
            <View style={styles.heroModalFooter}>
              <TouchableOpacity
                style={[styles.heroModalButton, styles.heroModalButtonDanger]}
                onPress={closeEditModal}
              >
                <Text style={styles.heroModalButtonDangerText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.heroModalButton, styles.heroModalButtonPrimary]}
                onPress={saveChanges}
              >
                <Text style={styles.heroModalButtonPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
