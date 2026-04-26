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

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://chatapp-1-i5is.onrender.com", // Add production URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".onrender.com")) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", protect, messageRoutes);
app.use("/api/invitations", protect, invitationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/conversations",conversationRoute);

export default app;