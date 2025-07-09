import axios from "axios";
import { CLOUD_NAME, UPLOAD_PRESET } from "../src/config/cloudinary";

export const uploadToCloudinary = async (image) => {
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

  const formData = new FormData();
  formData.append("file", {
    uri: image.uri,
    type: image.type,
    name: image.fileName || "photo.jpg",
  });
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await axios.post(CLOUDINARY_URL, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data.secure_url;
  } catch (error) {
    console.error("❌ Error al subir imagen:", error);
    throw error;
  }
};
