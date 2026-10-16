import { Router } from "express";
import { z } from "zod";
import { roles } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/security.js";
import { text } from "./schemas.js";
import * as w from "../controllers/attendanceController.js";
const router = Router();
router.get("/attendance", w.attendance);
router.post("/attendance/check-in", roles("employee"), w.checkIn);
router.post("/attendance/check-out", roles("employee"), w.checkOut);
router.patch(
  "/attendance/:id",
  roles("hr"),
  validate(
    z.object({
      status: z.enum(["present", "late", "absent", "leave", "half-day"]),
      checkIn: z.iso.datetime().optional(),
      checkOut: z.iso.datetime().optional(),
      note: text(1000),
    }),
  ),
  w.correctAttendance,
);
export default router;
