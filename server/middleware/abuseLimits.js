import rateLimit from "express-rate-limit";

// Authentication runs first: account quotas cannot be shared through a proxy.
const accountLimit = (limit, message) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    keyGenerator: (req) => String(req.user._id),
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });

export const passwordAttemptLimit = accountLimit(
  10,
  "Too many password attempts. Please try again in 15 minutes.",
);
export const avatarUploadLimit = accountLimit(
  10,
  "Too many photo uploads. Please try again in 15 minutes.",
);

export function accountConcurrencyLimit(limit, message) {
  const active = new Map();
  return (req, res, next) => {
    const key = String(req.user._id);
    const count = active.get(key) || 0;
    if (count >= limit) {
      res.set("Retry-After", "5");
      return res.status(429).json({ message });
    }
    active.set(key, count + 1);
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      const remaining = active.get(key) - 1;
      if (remaining) active.set(key, remaining);
      else active.delete(key);
      res.off("finish", release);
      res.off("close", release);
    };
    res.once("finish", release);
    res.once("close", release);
    next();
  };
}

export const avatarConcurrencyLimit = accountConcurrencyLimit(
  2,
  "A photo upload is already in progress. Please try again shortly.",
);
export const notificationConnectionLimit = accountConcurrencyLimit(
  5,
  "Too many live notification connections. Close an unused tab and try again.",
);
