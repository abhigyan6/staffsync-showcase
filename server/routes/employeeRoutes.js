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
import * as employees from "../controllers/employeeController.js";
const router = Router();
router.get("/employees/directory", roles("hr", "manager"), employees.directory);
router.get("/employees", roles("hr", "manager"), employees.list);
router.get("/employees/:id", employees.get);
router.post(
  "/employees",
  roles("hr"),
  validate(
    employee.extend({
      role: z.enum(["employee", "manager", "hr"]),
      password: securePassword,
    }),
  ),
  employees.create,
);
router.patch(
  "/employees/:id",
  roles("hr"),
  validate(employee.partial()),
  employees.update,
);
router.delete("/employees/:id", roles("hr"), employees.remove);
router.patch(
  "/profile",
  validate(
    z
      .object({
        firstName: text(60).optional(),
        lastName: text(60).optional(),
        phone: z.string().max(30).optional(),
        location: z.string().max(100).optional(),
        address: z.string().max(500).optional(),
        bio: z.string().max(1000).optional(),
      })
      .strict(),
  ),
  employees.profile,
);
router.patch(
  "/employees/:id/performance",
  roles("manager"),
  validate(z.object({ rating: z.number().min(1).max(5), note: text(2000) })),
  employees.performance,
);
export default router;
