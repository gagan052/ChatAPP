import { api } from "../../services/http";

export const loginApi = (email: string, password: string) =>
  api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const signupApi = (email: string, username: string, password: string) =>
  api("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });

export const uploadProfilePic = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const data = await api("/api/users/upload-profile", {
    method: "POST",
    body: formData,
  });

  return data.profilePic;
};
  
export const uploadFile = async (file: File) => {

  const formData = new FormData();
  
  formData.append("file", file);

  return api("/api/users/upload-file", {
    method: "POST",
    body: formData,
  });
};