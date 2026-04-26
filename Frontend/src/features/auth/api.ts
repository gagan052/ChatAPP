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
  