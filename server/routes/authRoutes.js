import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/security.js";
import { text, securePassword } from "./schemas.js";
import * as auth from "../controllers/authController.js";
import { passwordAttemptLimit } from "../middleware/abuseLimits.js";
const router = Router();
router.post(
  "/auth/register",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }),
  validate(
    z
      .object({
        firstName: text(60),
        lastName: text(60),
        email: z.email().toLowerCase(),
        password: securePassword,
        role: z.enum(["employee", "hr", "manager"]).default("employee"),
      })
      .strict(),
  ),
  auth.register,
);
router.post(
  "/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many sign-in attempts. Please try again later." },
  }),
  validate(z.object({ email: z.email(), password: text(128) })),
  auth.login,
);

router.use("/auth", authenticate);
router.get("/auth/me", auth.me);
router.post("/auth/logout", auth.logout);
router.post(
  "/auth/password",
  passwordAttemptLimit,
  validate(
    z.object({
      currentPassword: text(128),
      newPassword: securePassword,
    }),
  ),
  auth.password,
);

export default router;
