import { Router } from "express";
import { roles } from "../middleware/authMiddleware.js";
import * as r from "../controllers/reports.js";
const router = Router();
router.get("/reports", roles("hr"), r.reports);
export default router;
