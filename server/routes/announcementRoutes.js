import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { authenticate, roles } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/security.js";
import {
  text,
  securePassword,
  id,
  date,
  employee,
  announcement,
  training,
} from "./schemas.js";
import * as w from "../controllers/announcementController.js";
const router = Router();
router.get("/announcements", w.announcements);
router.post(
  "/announcements",
  roles("hr", "manager"),
  validate(announcement),
  w.postAnnouncement,
);
router.patch(
  "/announcements/:id",
  roles("hr", "manager"),
  validate(announcement.partial()),
  w.editAnnouncement,
);
router.delete(
  "/announcements/:id",
  roles("hr", "manager"),
  w.deleteAnnouncement,
);
export default router;
