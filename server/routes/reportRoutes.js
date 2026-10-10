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
import * as r from "../controllers/reports.js";
const router = Router();
router.get("/reports", roles("hr"), r.reports);
export default router;
