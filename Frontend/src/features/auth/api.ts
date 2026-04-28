import { api, BASE_URL } from "../../services/http";

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
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/api/users/upload-profile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload profile picture");
  }

  const data = await res.json();
  return data.profilePic;
};
  