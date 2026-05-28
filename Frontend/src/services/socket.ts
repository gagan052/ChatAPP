import { io } from "socket.io-client";
import { BASE_URL } from "./http";

export const socket = io(BASE_URL, {
  withCredentials: true,
  transports: ["websocket"],
});

export const connectSocket = (userId: string, username: string) => {
  if (!socket.connected) socket.connect();
  console.log("socket Connected from socket.ts");
  socket.emit("join", { userId, username });
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.emit("logout"); 
    console.log("socket Disconnected from socket.ts");
    socket.disconnect();
  }
};

export const logoutSocket = () => {
  socket.emit("logout");
};