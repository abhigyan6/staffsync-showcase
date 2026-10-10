import { z } from "zod";
const text = (n = 200) => z.string().trim().min(1).max(n);
const securePassword = z
  .string()
  .min(10)
  .max(72)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must be at most 72 UTF-8 bytes.",
  );
const id = z.string().regex(/^[a-f\d]{24}$/i);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      !Number.isNaN(Date.parse(s)) &&
      new Date(s).toISOString().slice(0, 10) === s,
    "Invalid calendar date",
  );
const employee = z.object({
  employeeId: text(30),
  firstName: text(60),
  lastName: text(60),
  email: z.email().toLowerCase(),
  department: text(80),
  jobTitle: text(100),
  manager: z.union([id, z.literal("")]).optional(),
  phone: z.string().max(30).optional(),
  location: z.string().max(100).optional(),
  joiningDate: date,
  salary: z.number().finite().min(0).nullable().optional(),
  address: z.string().trim().max(500).optional(),
});
const announcement = z.object({
  title: text(150),
  content: text(5000),
  category: z.enum(["Company", "People", "Events", "Policy"]),
  pinned: z.boolean().optional(),
  targetAudience: z.enum(["All", "Employees", "Managers"]).optional(),
});
const training = z.object({
  title: text(150),
  description: text(3000),
  category: text(80),
  dueDate: date,
  date: z.union([date, z.literal("")]).optional(),
  trainer: text(120).optional(),
  duration: text(60),
  resourceUrl: z
    .union([
      z.url().refine((v) => /^https?:\/\//.test(v), "Use an http or https URL"),
      z.literal(""),
    ])
    .optional(),
  employeeIds: z.array(id).min(1).max(500),
});
export { text, securePassword, id, date, employee, announcement, training };
