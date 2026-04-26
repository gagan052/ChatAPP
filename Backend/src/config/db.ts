import mongoose from "mongoose";

export const connectDB = async () => {

  const mongoURI = process.env.MONGO_URI;

  if(!mongoURI){
    throw new Error("MONGO_URI is not defined in .env");
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected Successfully to:", mongoURI.split("@")[1] || "Local DB");
  } catch (err) {
    console.error("MongoDB Connection Error Details:");
    console.error(err);
    // Don't exit immediately in production to allow logs to be captured
    setTimeout(() => process.exit(1), 5000);
  }
};
