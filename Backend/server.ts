import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./src/app.ts";
import { connectDB } from "./src/config/db.ts";
import { handleSockets } from "./src/sockets/socketHandler.ts";

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectDB();
handleSockets(io);

server.listen(3001, () => {
  console.log("Server running on port 3001");
});