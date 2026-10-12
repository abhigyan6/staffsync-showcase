import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, roles, validate } from "../middleware/security.js";
import * as auth from "../controllers/auth.js";
import * as employees from "../controllers/employees.js";
import * as w from "../controllers/workflows.js";
import * as r from "../controllers/reports.js";
import { events, fail, ownEmployee, audit } from "../services/core.js";
import multer from "multer";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import authRoutes from "./authRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import announcementRoutes from "./announcementRoutes.js";
import trainingRoutes from "./trainingRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import reportRoutes from "./reportRoutes.js";
import {
  avatarUploadLimit,
  avatarConcurrencyLimit,
  notificationConnectionLimit,
} from "../middleware/abuseLimits.js";
const router = Router();
router.use(authRoutes);
router.use(authenticate);
router.get("/dashboard", r.dashboard);
router.use(employeeRoutes);
router.use(leaveRoutes);
router.use(attendanceRoutes);
router.use(announcementRoutes);
router.use(trainingRoutes);
router.use(notificationRoutes);
router.use(reportRoutes);
router.get("/events", notificationConnectionLimit, (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write("event: ready\ndata: {}\n\n");
  const change = () => res.write("event: refresh\ndata: {}\n\n");
  events.on("change", change);
  const timer = setInterval(() => res.write(": keepalive\n\n"), 25000);
  const expiry = setTimeout(() => res.end(), 8 * 60 * 60 * 1000);
  res.once("close", () => {
    events.off("change", change);
    clearInterval(timer);
    clearTimeout(expiry);
  });
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
});
router.post(
  "/profile/avatar",
  avatarUploadLimit,
  avatarConcurrencyLimit,
  upload.single("file"),
  async (req, res) => {
    const f = req.file;
    if (!f) fail(400, "Choose an image to upload.");
    const b = f.buffer;
    let ext;
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) ext = "jpg";
    else if (
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      ext = "png";
    else if (
      b.subarray(0, 4).toString() === "RIFF" &&
      b.subarray(8, 12).toString() === "WEBP"
    )
      ext = "webp";
    else fail(400, "Only JPEG, PNG, and WebP images are supported.");
    const e = await ownEmployee(req.user);
    const dir = process.env.UPLOAD_DIR || path.resolve("uploads");
    await fs.mkdir(dir, { recursive: true });
    const filename = randomUUID() + "." + ext;
    await fs.writeFile(path.join(dir, filename), b);
    if (e.avatar) {
      const old = e.avatar.split("/").at(-1);
      await fs.unlink(path.join(dir, old)).catch(() => {});
    }
    e.avatar = "/api/avatars/" + filename;
    await e.save();
    await audit(req.user, "Profile photo updated", e._id);
    res.json(e);
  },
);
router.get("/avatars/:name", async (req, res) => {
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(req.params.name))
    fail(404, "Image not found.");
  res.sendFile(
    path.join(
      process.env.UPLOAD_DIR || path.resolve("uploads"),
      req.params.name,
    ),
  );
});
export default router;
