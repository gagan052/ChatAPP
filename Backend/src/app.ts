import express from "express";
import authRoutes from "./routes/authRoutes";
import messageRoutes from "./routes/messageRoutes";
import userRoutes from "./routes/userRoutes";
import groupRoutes from "./routes/groupRoutes";
import conversationRoute from "./routes/converstionRoutes"
import cors from "cors";
import { protect } from "./middlewares/authMiddleware";
import invitationRoutes from "./routes/invitaionRoute";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", protect, messageRoutes);
app.use("/api/invitations", protect, invitationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/conversations",conversationRoute);

export default app;