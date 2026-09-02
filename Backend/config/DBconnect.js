import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI?.trim();

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is not set. Add it to Backend/.env or your deployment environment.",
      );
    }

    mongoose.connection.on("connected", () => {
      console.log("MongoDB Connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("❌MongoDB Disconnected");
    });

    await mongoose.connect(mongoUri);
    console.log("✅MongoDB connect attempt using URI: [REDACTED]");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
