import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import chalk from "chalk";

import app from "./src-back/app";
import { connectDB } from "./src-back/config/db";
import { handleSockets } from "./src-back/sockets/socketHandler";
import { printRoutes } from "./src-back/utils/printRoutes";

dotenv.config();
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://chatapp-1-i5is.onrender.com",
  "https://zynk-gagan.onrender.com",
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});


app.set("io", io);

connectDB();
handleSockets(io);

server.listen(PORT, () => {
  console.log(
    chalk.yellow(`Server running on port ${PORT}`)
  );

  printRoutes(app);
});