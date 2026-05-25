import mongoose from "mongoose";

export const connectDB = async () => {

  const mongoURI = process.env.MONGO_URI;

  if(!mongoURI){
    throw new Error("MONGO_URI is not defined in .env");
  }

  try {
    console.log("Attempting to connect to MongoDB...");
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    console.log("MongoDB Connected Successfully");
  } catch (err: any) {
    console.error("MongoDB Connection Error Details:");
    if (err.code === 'ECONNREFUSED' && err.syscall === 'querySrv') {
      console.error("DNS Error: Could not resolve MongoDB SRV record.");
      
    }
    console.error(err);
    setTimeout(() => process.exit(1), 5000);
  }
};
