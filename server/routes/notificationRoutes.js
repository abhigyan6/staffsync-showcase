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
import * as w from "../controllers/notificationController.js";
const router = Router();
router.get("/notifications", w.notifications);
router.patch("/notifications/read-all", w.readNotifications);
router.patch("/notifications/:id/read", w.readNotifications);

export default router;
