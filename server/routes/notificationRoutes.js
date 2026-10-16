import { Router } from "express";
import * as w from "../controllers/notificationController.js";
const router = Router();
router.get("/notifications", w.notifications);
router.patch("/notifications/read-all", w.readNotifications);
router.patch("/notifications/:id/read", w.readNotifications);

export default router;
