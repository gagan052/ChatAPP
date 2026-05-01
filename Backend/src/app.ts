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
  "https://chatapp-1-i5is.onrender.com",
  "https://zynk-gagan.onrender.com", 
];

app.use(cors({
  origin: function (origin, callback) {
    
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
app.use("/api/groups", protect,groupRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/conversations",protect, conversationRoute);

app.use((err: any, req: any, res: any, next: any) => {
  console.error("UNHANDLED API ERROR:", err);
  if (res.headersSent) {
    return next(err);
  }
  return res.status(500).json({ message: err?.message || "Server error" });
});

export default app;