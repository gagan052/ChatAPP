import mongoose from "mongoose";

export const connectDB = async () => {

  const mongoURI = process.env.MONGO_URI;

  if(!mongoURI){
    throw new Error("MONGO_URI is not defined in .env");
  }

  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
