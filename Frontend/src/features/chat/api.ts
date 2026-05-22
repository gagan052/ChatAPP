import axios from "axios";

// ================= BASE URL =================

export const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:3001"
    : "https://chatapp-1-i5is.onrender.com";

// ================= AXIOS INSTANCE =================

export const api = axios.create({
  baseURL: BASE_URL,

  withCredentials: true,
});


// ================= FILE UPLOAD =================

export const uploadChatFile = async (
  file: File,
  onProgress?: (progress: number) => void
) => {

  const formData = new FormData();

  formData.append("file", file);



  const res = await api.post(
    "/api/messages/upload",

    formData,

    {
      headers: {
        "Content-Type": "multipart/form-data",
      },

      onUploadProgress: (progressEvent) => {

        if (!onProgress) return;

        const percent = Math.round(
          (progressEvent.loaded * 100) /
          (progressEvent.total || 1)
        );

        onProgress(percent);
      },
    }
  );



  return res.data;
};