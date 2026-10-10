import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { User, Employee } from "../models/index.js";
import { fail, audit } from "../services/core.js";
export async function session(user) {
  const employee = await Employee.findOne({ user: user._id }).select(
    "+salary +address",
  );
  return { id: user._id, role: user.role, email: user.email, employee };
}
export async function login(req, res) {
  const user = await User.findOne({
    email: req.body.email.toLowerCase(),
    active: true,
  }).select("+passwordHash");
  if (!user || !(await user.matchPassword(req.body.password)))
    fail(401, "Email or password is incorrect.");
  const token = jwt.sign({ v: user.sessionVersion }, process.env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: "8h",
    issuer: "staffsync",
    audience: "staffsync-app",
    algorithm: "HS256",
  });
  res.cookie("staffsync_session", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  res.json({ ...(await session(user)), token });
}
export async function me(req, res) {
  res.json(await session(req.user));
}
export async function logout(req, res) {
  await User.updateOne({ _id: req.user._id }, { $inc: { sessionVersion: 1 } });
  res.clearCookie("staffsync_session", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
  });
  res.json({ message: "Signed out." });
}
export async function password(req, res) {
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!(await user.matchPassword(req.body.currentPassword)))
    fail(400, "Current password is incorrect.");
  user.password = req.body.newPassword;
  user.sessionVersion++;
  await user.save();
  res.clearCookie("staffsync_session", { path: "/" });
  await audit(req.user, "Password changed", user._id);
  res.json({ message: "Password changed. Please sign in again." });
}

export async function register(req, res) {
  const { firstName, lastName, email, password, role = "employee" } = req.body;
  if (await User.exists({ email }))
    fail(409, "An account with this email already exists.");
  const user = await User.create({ email, password, role });
  try {
    await Employee.create({
      user: user._id,
      firstName,
      lastName,
      email,
      employeeId: `REG-${randomUUID()}`,
      department: "Unassigned",
      jobTitle: { hr: "HR", manager: "Manager", employee: "Employee" }[role],
      joiningDate: new Date().toISOString().slice(0, 10),
    });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }
  await audit(user, "Account registered", user._id);
  res.status(201).json({ message: "Account created. You can now sign in." });
}
