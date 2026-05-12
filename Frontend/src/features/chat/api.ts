// import { api } from "../../services/http";
import axios from "axios";

export const uploadChatFile = async (
  file: File,
  onProgress?: (progress: number) => void
) => {
  const formData = new FormData();
  formData.append("file", file);

  const token = localStorage.getItem("token");

  const res = await axios.post(
    "https://chatapp-1-i5is.onrender.com/api/messages/upload",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },

      onUploadProgress: (progressEvent) => {
        if (!onProgress) return;

        const percent = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );

        onProgress(percent);
      },

    }
  );

  return res.data;
};
