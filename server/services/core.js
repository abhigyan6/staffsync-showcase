import { EventEmitter } from "node:events";
import { Employee, Notification, Audit } from "../models/index.js";
export const events = new EventEmitter();
events.setMaxListeners(100);
export const day = (value = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export const span = (start, end) =>
  Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
export const fail = (status, message) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
export async function scope(user) {
  if (user.role === "hr") return {};
  return user.role === "manager" ? { manager: user._id } : { user: user._id };
}
export async function accessibleEmployees(user) {
  return Employee.find(await scope(user)).select("_id");
}
export async function assertEmployee(user, id) {
  const e = await Employee.findOne({ _id: id, ...(await scope(user)) });
  if (!e) fail(404, "Employee not found or outside your access.");
  return e;
}
export async function ownEmployee(user) {
  const e = await Employee.findOne({ user: user._id, status: "active" });
  if (!e) fail(404, "Active employee profile not found.");
  return e;
}
export async function notify(recipient, title, message, link = "/dashboard") {
  if (recipient) await Notification.create({ recipient, title, message, link });
}
export async function audit(user, action, target, detail = "") {
  await Audit.create({
    actor: user._id,
    action,
    target: String(target),
    detail,
  });
  events.emit("change");
}
export const pagination = (q) => ({
  page: Math.max(1, parseInt(q.page) || 1),
  limit: Math.min(100, Math.max(1, parseInt(q.limit) || 12)),
});
export const literal = (text = "") =>
  String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
