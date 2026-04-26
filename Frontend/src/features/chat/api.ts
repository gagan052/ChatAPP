import { api } from "../../services/http";

export const fetchMessages = (u1: string, u2: string) =>
  api(`/api/messages/${u1}/${u2}`);