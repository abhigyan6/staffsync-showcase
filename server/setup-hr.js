import "dotenv/config";
import readline from "node:readline/promises";
import mongoose from "mongoose";
import { User, Employee } from "./models/index.js";

if (!process.env.MONGODB_URI)
  throw new Error("Set MONGODB_URI before creating a production HR account.");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const email = (await rl.question("HR email: ")).trim().toLowerCase();
const firstName = (await rl.question("First name: ")).trim();
const lastName = (await rl.question("Last name: ")).trim();
rl.close();
let password = process.env.STAFFSYNC_SETUP_PASSWORD;
if (!password) {
  if (!process.stdin.isTTY)
    throw new Error(
      "Provide STAFFSYNC_SETUP_PASSWORD through a secure environment variable in non-interactive sessions.",
    );
  process.stdout.write("Initial password (hidden): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  password = await new Promise((resolve) => {
    let value = "";
    const read = (chunk) => {
      for (const character of chunk.toString()) {
        if (character === "\u0003") {
          process.stdin.setRawMode(false);
          process.exit(130);
        }
        if (character === "\r" || character === "\n") {
          process.stdin.off("data", read);
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b")
          value = value.slice(0, -1);
        else value += character;
      }
    };
    process.stdin.on("data", read);
  });
}
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !firstName ||
  !lastName ||
  password.length < 12 ||
  Buffer.byteLength(password, "utf8") > 72
)
  throw new Error(
    "Provide a valid email, names, and a password of at least 12 characters.",
  );
await mongoose.connect(process.env.MONGODB_URI);
try {
  const user = await User.create({
    email,
    role: "hr",
    password,
  });
  try {
    await Employee.create({
      user: user._id,
      employeeId: "HR-" + Date.now(),
      firstName,
      lastName,
      email,
      department: "People",
      jobTitle: "HR administrator",
      joiningDate: new Date().toISOString().slice(0, 10),
    });
  } catch (e) {
    await User.deleteOne({ _id: user._id });
    throw e;
  }
  console.log("HR account created. Sign in to add your team.");
} finally {
  await mongoose.disconnect();
}
