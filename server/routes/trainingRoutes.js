import { Router } from "express";
import { z } from "zod";
import { roles } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/security.js";
import { training } from "./schemas.js";
import * as w from "../controllers/trainingController.js";
const router = Router();
router.get("/training", w.trainings);
router.post(
  "/training",
  roles("manager"),
  validate(training),
  w.createTraining,
);
router.patch(
  "/training/:id",
  roles("manager"),
  validate(training.partial()),
  w.updateTraining,
);
router.delete("/training/:id", roles("manager"), w.deleteTraining);
router.patch(
  "/training/:id/progress",
  roles("employee"),
  validate(
    z.object({ status: z.enum(["assigned", "in-progress", "completed"]) }),
  ),
  w.progress,
);
export default router;
