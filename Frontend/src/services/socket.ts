import { io } from "socket.io-client";
import { BASE_URL } from "./http";

export const socket = io(BASE_URL, {
  autoConnect: false,
});

export const connectSocket = (userId: string, username: string) => {
  if (!socket.connected) socket.connect();
  socket.emit("join", { userId, username });
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.emit("logout"); 
    socket.disconnect();
  }
};