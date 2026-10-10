import "dotenv/config";
import mongoose from "mongoose";
import { connectDatabase } from "./db.js";
import { seed } from "./seed.js";
const mongo = await connectDatabase();
await seed();
await mongoose.disconnect();
if (mongo) await mongo.stop();
