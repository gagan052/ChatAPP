import { api } from "../../services/http";

export const uploadChatFile = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return api("/api/messages/upload", {
    method: "POST",
    body: formData,
  });
};
