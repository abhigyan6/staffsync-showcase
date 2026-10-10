import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { fail } from "../services/core.js";
export async function authenticate(req, res, next) {
  try {
    const authorization = req.get("authorization");
    if (authorization && !/^Bearer [^\s]+$/i.test(authorization))
      fail(401, "Use a valid Bearer token.");
    const raw = authorization
      ? authorization.slice(7)
      : req.cookies?.staffsync_session;
    if (!raw) fail(401, "Please sign in to continue.");
    const payload = jwt.verify(raw, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "staffsync",
      audience: "staffsync-app",
    });
    const user = await User.findById(payload.sub);
    if (!user?.active || user.sessionVersion !== payload.v)
      fail(401, "Your session has ended. Please sign in again.");
    req.user = user;
    next();
  } catch (e) {
    if (e.name === "JsonWebTokenError" || e.name === "TokenExpiredError")
      e.status = 401;
    next(e);
  }
}
export const roles =
  (...allowed) =>
  (req, res, next) => {
    if (!allowed.includes(req.user.role))
      return next(
        Object.assign(new Error("Your role cannot perform this action."), {
          status: 403,
        }),
      );
    next();
  };
