import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./src-back/app.ts";
import { connectDB } from "./src-back/config/db.ts";
import { handleSockets } from "./src-back/sockets/socketHandler.ts";

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

console.log("socket from server.ts",io)

connectDB();
handleSockets(io);

server.listen(3001, () => {
  console.log("Server running on port 3001");
});