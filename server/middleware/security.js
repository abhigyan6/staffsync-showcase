export { authenticate, roles } from "./authMiddleware.js";
export const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return next(
      Object.assign(
        new Error(
          parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        ),
        { status: 400 },
      ),
    );
  req.body = parsed.data;
  next();
};
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message;
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "Choose an image smaller than 3 MB.";
  } else if (err.name === "MulterError") {
    status = 400;
    message = "Upload one supported profile image.";
  }
  if (err.code === 11000) {
    status = 409;
    message = "An account or record with these details already exists.";
  }
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid record ID.";
  }
  if (err.name === "ValidationError") {
    status = 400;
  }
  if (status === 500) {
    console.error(err);
    message = "Something went wrong. Please try again.";
  }
  res.status(status).json({ message });
}
export function originGuard(req, res, next) {
  if (
    ["POST", "PUT", "PATCH", "DELETE"].includes(req.method) &&
    req.headers.origin
  ) {
    const allowed = (
      process.env.CLIENT_ORIGIN ||
      "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174,http://localhost:5174,http://127.0.0.1:4000,http://localhost:4000"
    ).split(",");
    if (!allowed.includes(req.headers.origin))
      return res.status(403).json({ message: "This origin is not permitted." });
  }
  next();
}
