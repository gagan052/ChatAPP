import { api } from "../../services/http";

export const fetchUsers = () => api("/api/users");