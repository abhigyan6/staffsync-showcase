import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "node:path";
import fs from "node:fs/promises";
import os from "node:os";
import { createApp } from "../server/app.js";
import { seed } from "../server/seed.js";
import {
  User,
  Employee,
  Leave,
  Attendance,
  Training,
} from "../server/models/index.js";
import { day } from "../server/services/core.js";
let mongo, app, hr, manager, employee, other, own, outsider;
const plus = (n) => day(new Date(Date.now() + n * 86400000));
async function agent(email) {
  const a = request.agent(app);
  const r = await a
    .post("/api/auth/login")
    .send({ email, password: "StaffSync@2026" });
  assert.equal(r.status, 200);
  return a;
}
before(async () => {
  process.env.JWT_SECRET =
    "test-only-secret-with-at-least-thirty-two-characters";
  mongo = await MongoMemoryServer.create({
    binary: { downloadDir: path.resolve(".runtime/binaries") },
  });
  process.env.UPLOAD_DIR = await fs.mkdtemp(
    path.join(os.tmpdir(), "staffsync-test-uploads-"),
  );
  await mongoose.connect(mongo.getUri());
  await seed();
  app = createApp();
  hr = await agent("hr@staffsync.demo");
  manager = await agent("manager@staffsync.demo");
  employee = await agent("employee@staffsync.demo");
  other = await agent("sana@staffsync.demo");
  own = await Employee.findOne({ email: "employee@staffsync.demo" });
  outsider = await Employee.findOne({ email: "sana@staffsync.demo" });
});
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
  await fs.rm(process.env.UPLOAD_DIR, { recursive: true, force: true });
});
test("protected endpoints require authentication and reject invalid credentials", async () => {
  assert.equal((await request(app).get("/api/dashboard")).status, 401);
  assert.equal(
    (
      await request(app)
        .post("/api/auth/login")
        .send({ email: "hr@staffsync.demo", password: "incorrect" })
    ).status,
    401,
  );
});
test("employees cannot access HR reports or create employee accounts", async () => {
  assert.equal((await employee.get("/api/reports")).status, 403);
  assert.equal((await employee.post("/api/employees").send({})).status, 403);
  assert.equal((await employee.get("/api/employees")).status, 403);
});
test("manager directory is scoped to direct reports and blocks unrelated profiles", async () => {
  const r = await manager.get("/api/employees");
  assert.equal(r.status, 200);
  assert.ok(r.body.items.some((e) => e._id === String(own._id)));
  assert.ok(!r.body.items.some((e) => e._id === String(outsider._id)));
  assert.equal(
    (await manager.get("/api/employees/" + outsider._id)).status,
    404,
  );
});
test("profile updates reject privilege and employment-field injection", async () => {
  const r = await employee
    .patch("/api/profile")
    .send({ role: "hr", department: "Admin" });
  assert.equal(r.status, 400);
  assert.equal((await employee.get("/api/auth/me")).body.role, "employee");
});
test("leave submission validates dates and prevents overlapping concurrent submissions", async () => {
  assert.equal(
    (
      await employee.post("/api/leaves").send({
        type: "Annual",
        startDate: "2026-02-30",
        endDate: plus(40),
        reason: "Invalid",
      })
    ).status,
    400,
  );
  const payload = {
    type: "Annual",
    startDate: plus(40),
    endDate: plus(42),
    reason: "Planned family time.",
  };
  const responses = await Promise.all([
    employee.post("/api/leaves").send(payload),
    employee.post("/api/leaves").send(payload),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    await Leave.countDocuments({
      employee: own._id,
      startDate: payload.startDate,
    }),
    1,
  );
});
test("review authorization and atomic decisions prevent double approval", async () => {
  const l = await Leave.create({
    employee: outsider._id,
    type: "Sick",
    startDate: plus(50),
    endDate: plus(50),
    days: 1,
    reason: "Appointment",
  });
  assert.equal(
    (
      await manager
        .patch(`/api/leaves/${l._id}/review`)
        .send({ status: "approved" })
    ).status,
    404,
  );
  assert.equal(
    (
      await other
        .patch(`/api/leaves/${l._id}/review`)
        .send({ status: "approved" })
    ).status,
    403,
  );
  const results = await Promise.all([
    hr.patch(`/api/leaves/${l._id}/review`).send({ status: "approved" }),
    hr.patch(`/api/leaves/${l._id}/review`).send({ status: "rejected" }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
});
test("attendance permits one daily check-in and one check-out", async () => {
  await Attendance.deleteMany({ employee: own._id, date: day() });
  assert.equal((await employee.post("/api/attendance/check-out")).status, 409);
  assert.equal((await employee.post("/api/attendance/check-in")).status, 201);
  assert.equal((await employee.post("/api/attendance/check-in")).status, 409);
  assert.equal((await employee.post("/api/attendance/check-out")).status, 200);
  assert.equal((await employee.post("/api/attendance/check-out")).status, 409);
});
test("managers cannot assign training outside their team", async () => {
  const payload = {
    title: "Test program",
    description: "A practical training program.",
    category: "Technical",
    dueDate: plus(30),
    duration: "1 hour",
    employeeIds: [String(outsider._id)],
  };
  assert.equal((await manager.post("/api/training").send(payload)).status, 403);
  const created = await manager
    .post("/api/training")
    .send({ ...payload, employeeIds: [String(own._id)] });
  assert.equal(created.status, 201);
  assert.equal(
    (
      await other
        .patch(`/api/training/${created.body._id}/progress`)
        .send({ status: "completed" })
    ).status,
    404,
  );
  assert.equal(
    (
      await employee
        .patch(`/api/training/${created.body._id}/progress`)
        .send({ status: "completed" })
    ).status,
    200,
  );
});
test("employee training responses do not expose coworkers’ assignments", async () => {
  const r = await employee.get("/api/training");
  assert.equal(r.status, 200);
  for (const t of r.body.items)
    for (const a of t.assignments)
      assert.equal(a.employee._id, String(own._id));
});
test("announcements enforce authorship and reject employee publishing", async () => {
  assert.equal(
    (await employee.post("/api/announcements").send({ title: "Unauthorized" }))
      .status,
    403,
  );
  const r = await hr.post("/api/announcements").send({
    title: "Policy update",
    content: "Review our updated policy.",
    category: "Policy",
    pinned: false,
  });
  assert.equal(r.status, 201);
  assert.equal(
    (
      await manager
        .patch(`/api/announcements/${r.body._id}`)
        .send({ title: "Overwrite" })
    ).status,
    404,
  );
});
test("cross-origin mutations are rejected", async () => {
  assert.equal(
    (
      await employee
        .patch("/api/profile")
        .set("Origin", "https://untrusted.example")
        .send({ phone: "123" })
    ).status,
    403,
  );
});
test("uploads reject scripts and oversized files", async () => {
  assert.equal(
    (
      await employee
        .post("/api/profile/avatar")
        .attach("file", Buffer.from("<script>alert(1)</script>"), "avatar.svg")
    ).status,
    400,
  );
});
test("profile photos are stored and require authentication to retrieve", async () => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWl0AAAAASUVORK5CYII=",
    "base64",
  );
  const upload = await employee
    .post("/api/profile/avatar")
    .attach("file", png, "avatar.png");
  assert.equal(upload.status, 200);
  assert.ok(upload.body.avatar.startsWith("/api/avatars/"));
  assert.equal((await employee.get(upload.body.avatar)).status, 200);
  assert.equal((await request(app).get(upload.body.avatar)).status, 401);
  const tooLarge = await employee
    .post("/api/profile/avatar")
    .attach("file", Buffer.alloc(3 * 1024 * 1024 + 1), "large.png");
  assert.equal(tooLarge.status, 413);
});
test("HR creates an employee, edits it, and removes access while preserving records", async () => {
  const r = await hr.post("/api/employees").send({
    firstName: "Test",
    lastName: "Person",
    employeeId: "TEST-999",
    email: "test@staffsync.demo",
    department: "Engineering",
    jobTitle: "Engineer",
    joiningDate: day(),
    role: "employee",
    password: "StaffSync@2026",
  });
  assert.equal(r.status, 201);
  const testAgent = await agent("test@staffsync.demo");
  assert.equal(
    (
      await hr
        .patch(`/api/employees/${r.body._id}`)
        .send({ jobTitle: "Senior Engineer" })
    ).status,
    200,
  );
  assert.equal((await hr.delete(`/api/employees/${r.body._id}`)).status, 200);
  assert.equal((await testAgent.get("/api/auth/me")).status, 401);
  assert.equal((await Employee.findById(r.body._id)).status, "inactive");
});
test("registration supports all demo roles, hashes passwords, and supports revocable bearer tokens", async () => {
  const payload = {
    firstName: "Test",
    lastName: "Registrant",
    email: "register@example.test",
    password: "Register@2026",
  };
  for (const role of ["hr", "manager"]) {
    const email = `${role}-register@example.test`;
    assert.equal(
      (
        await request(app)
          .post("/api/auth/register")
          .send({ ...payload, email, role })
      ).status,
      201,
    );
    const account = request.agent(app);
    const signedIn = await account
      .post("/api/auth/login")
      .send({ email, password: payload.password });
    assert.equal(signedIn.status, 200);
    assert.equal(signedIn.body.role, role);
    assert.equal(
      signedIn.body.employee.jobTitle,
      role === "hr" ? "HR" : "Manager",
    );
    assert.equal((await account.get("/api/auth/me")).body.role, role);
  }
  assert.equal(
    (
      await request(app)
        .post("/api/auth/register")
        .send({ ...payload, role: "admin" })
    ).status,
    400,
  );
  assert.equal(
    (await request(app).post("/api/auth/register").send(payload)).status,
    201,
  );
  assert.equal(
    (await request(app).post("/api/auth/register").send(payload)).status,
    409,
  );
  const stored = await User.findOne({ email: payload.email }).select(
    "+passwordHash",
  );
  assert.notEqual(stored.passwordHash, payload.password);
  assert.equal(await stored.matchPassword(payload.password), true);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: payload.email, password: payload.password });
  assert.equal(login.status, 200);
  assert.equal(login.body.role, "employee");
  assert.equal(login.body.passwordHash, undefined);
  const bearer = `Bearer ${login.body.token}`;
  assert.equal(
    (await request(app).get("/api/auth/me").set("Authorization", bearer))
      .status,
    200,
  );
  assert.equal(
    (
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid")
    ).status,
    401,
  );
  assert.equal(
    (await request(app).post("/api/auth/logout").set("Authorization", bearer))
      .status,
    200,
  );
  assert.equal(
    (await request(app).get("/api/auth/me").set("Authorization", bearer))
      .status,
    401,
  );
});

test("salary and address are restricted to HR and the employee", async () => {
  const saved = await hr
    .patch(`/api/employees/${own._id}`)
    .send({ salary: 45000, address: "Example address" });
  assert.equal(saved.status, 200);
  assert.equal((await hr.get(`/api/employees/${own._id}`)).body.salary, 45000);
  assert.equal(
    (await employee.get("/api/auth/me")).body.employee.salary,
    45000,
  );
  const managed = await manager.get(`/api/employees/${own._id}`);
  assert.equal(managed.body.salary, undefined);
  assert.equal(managed.body.address, undefined);
  assert.equal(
    (await employee.patch("/api/profile").send({ salary: 999999 })).status,
    400,
  );
});

test("announcement audiences filter lists and dashboards", async () => {
  const created = await hr.post("/api/announcements").send({
    title: "Manager audience test",
    content: "Managers only",
    category: "Company",
    targetAudience: "Managers",
  });
  assert.equal(created.status, 201);
  const matches = (items) =>
    items.some((item) => item._id === created.body._id);
  assert.equal(
    matches((await employee.get("/api/announcements")).body.items),
    false,
  );
  assert.equal(
    matches((await manager.get("/api/announcements")).body.items),
    true,
  );
  const dashboard = await employee.get("/api/dashboard");
  assert.equal(
    JSON.stringify(dashboard.body).includes("Manager audience test"),
    false,
  );
});

test("half-day corrections and training schedule details persist", async () => {
  const record = await Attendance.findOne({ employee: own._id });
  assert.equal(
    (
      await hr
        .patch(`/api/attendance/${record._id}`)
        .send({ status: "half-day", note: "Approved half day" })
    ).status,
    200,
  );
  assert.equal((await Attendance.findById(record._id)).status, "half-day");
  const payload = {
    title: "Scheduled training",
    description: "Learn together",
    category: "Skills",
    date: plus(2),
    dueDate: plus(3),
    trainer: "Example trainer",
    duration: "1 hour",
    employeeIds: [String(own._id)],
  };
  assert.equal(
    (await manager.post("/api/training").send({ ...payload, date: plus(4) }))
      .status,
    400,
  );
  const training = await manager.post("/api/training").send(payload);
  assert.equal(training.status, 201);
  assert.equal(training.body.trainer, "Example trainer");
  assert.equal(training.body.date, plus(2));
});

test("password change invalidates existing sessions", async () => {
  const a = await agent("kabir@staffsync.demo");
  const b = await agent("kabir@staffsync.demo");
  assert.equal(
    (
      await a.post("/api/auth/password").send({
        currentPassword: "StaffSync@2026",
        newPassword: "NewStrongPassword!123",
      })
    ).status,
    200,
  );
  assert.equal((await b.get("/api/auth/me")).status, 401);
});
test("logout revokes the session cookie even if replayed", async () => {
  const a = request.agent(app);
  const signedIn = await a
    .post("/api/auth/login")
    .send({ email: "dev@staffsync.demo", password: "StaffSync@2026" });
  const oldCookie = signedIn.headers["set-cookie"][0].split(";")[0];
  const r = await a.post("/api/auth/logout");
  assert.equal(r.status, 200);
  assert.equal((await a.get("/api/dashboard")).status, 401);
  assert.equal(
    (await request(app).get("/api/dashboard").set("Cookie", oldCookie)).status,
    401,
  );
});
