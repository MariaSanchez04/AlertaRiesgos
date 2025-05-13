import React, { useEffect, useState } from "react";
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
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";

export default function AdminScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("");

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
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedUser(null);
    setEditFirstName("");
    setEditLastName("");
    setEditRole("");
  };

  const saveChanges = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, {
        firstName: editFirstName,
        lastName: editLastName,
        role: editRole,
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, firstName: editFirstName, lastName: editLastName, role: editRole }
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
      <Text style={styles.title}>Panel de Administración</Text>
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
        )}
      />

      {/* Modal de edición */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={editFirstName}
              onChangeText={setEditFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Apellido"
              value={editLastName}
              onChangeText={setEditLastName}
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
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeEditModal}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
                <Text style={styles.saveButtonText}>Guardar</Text>
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
    padding: 20,
    backgroundColor: "#f7f7f7",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  userText: {
    fontSize: 16,
    color: "#333",
  },
  boldText: {
    fontWeight: "bold",
  },
  editButton: {
    marginTop: 10,
    backgroundColor: "#4caf50",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: "#e63946",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  picker: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    backgroundColor: "#888",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#4caf50",
    padding: 10,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
  },
});
