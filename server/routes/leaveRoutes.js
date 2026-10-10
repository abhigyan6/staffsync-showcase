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
import * as w from "../controllers/leaveController.js";
const router = Router();
router.get("/leaves", w.leaves);
router.post(
  "/leaves",
  roles("employee"),
  validate(
    z.object({
      type: z.enum(["Annual", "Sick", "Personal", "Unpaid"]),
      startDate: date,
      endDate: date,
      reason: text(1000),
    }),
  ),
  w.apply,
);
router.patch(
  "/leaves/:id/review",
  roles("hr", "manager"),
  validate(
    z.object({
      status: z.enum(["approved", "rejected"]),
      comment: z.string().max(1000).optional(),
    }),
  ),
  w.review,
);
router.patch("/leaves/:id/cancel", roles("employee"), w.cancel);
export default router;
