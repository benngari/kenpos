import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in environment variables");
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected to MongoDB: ${mongoose.connection.name}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err);
  });
}
