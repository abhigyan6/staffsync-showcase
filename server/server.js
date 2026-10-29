/*
 * Copyright (c) 2026 Abhigyan Dwivedi.
 * StaffSync — limited local evaluation only. See LICENSE and NOTICE.md.
 */

import "dotenv/config";
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import mongoose from "mongoose";
import { connectDatabase } from "./config/db.js";
import { seed } from "./seed.js";
import { createApp } from "./app.js";
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production")
    throw new Error("JWT_SECRET is required in production.");
  await fs.mkdir(".runtime", { recursive: true });
  let secret;
  try {
    secret = await fs.readFile(".runtime/jwt-secret", "utf8");
  } catch {
    secret = randomBytes(48).toString("hex");
    await fs.writeFile(".runtime/jwt-secret", secret, { mode: 0o600 });
  }
  process.env.JWT_SECRET = secret;
}
if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32)
  throw new Error("JWT_SECRET must be at least 32 characters in production.");
const mongo = await connectDatabase();
if (process.env.SEED_DEMO !== "false" && process.env.NODE_ENV !== "production")
  await seed();
const server = createApp().listen(
  Number(process.env.PORT) || 4000,
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      "StaffSync API ready at http://127.0.0.1:" + (process.env.PORT || 4000),
    ),
);
async function shutdown() {
  server.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
