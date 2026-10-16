import { Router } from "express";
import { roles } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/security.js";
import { announcement } from "./schemas.js";
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
