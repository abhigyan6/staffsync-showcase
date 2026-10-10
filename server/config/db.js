import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "node:fs/promises";
import path from "node:path";
export async function connectDatabase() {
  if (process.env.MONGODB_URI) {
    await mongoose.connect(process.env.MONGODB_URI);
    return null;
  }
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "Set MONGODB_URI for production. Embedded MongoDB is for local development only.",
    );
  const dir = path.resolve(".runtime/mongodb");
  await fs.mkdir(dir, { recursive: true });
  const mongo = await MongoMemoryServer.create({
    binary: { downloadDir: path.resolve(".runtime/binaries") },
    instance: { dbPath: dir, storageEngine: "wiredTiger", dbName: "staffsync" },
  });
  await mongoose.connect(mongo.getUri());
  return mongo;
}
