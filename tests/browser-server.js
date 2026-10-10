import mongoose from "mongoose";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../server/app.js";
import { seed } from "../server/seed.js";
process.env.JWT_SECRET =
  "isolated-browser-test-only-secret-at-least-32-characters";
process.env.CLIENT_ORIGIN = "http://127.0.0.1:5175";
const mongo = await MongoMemoryServer.create({
  binary: { downloadDir: path.resolve(".runtime/binaries") },
});
await mongoose.connect(mongo.getUri());
await seed();
const server = createApp().listen(4001, "127.0.0.1", () =>
  console.log("Isolated browser test API ready."),
);
async function stop() {
  server.close();
  await mongoose.disconnect();
  await mongo.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
