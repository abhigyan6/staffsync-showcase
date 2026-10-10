import {
  Employee,
  Leave,
  Attendance,
  Announcement,
  Training,
  Notification,
  User,
} from "../models/index.js";
import {
  accessibleEmployees,
  assertEmployee,
  ownEmployee,
  scope,
  day,
  span,
  fail,
  notify,
  audit,
  pagination,
  literal,
} from "../services/core.js";
export async function trainings(req, res) {
  const q =
    req.user.role === "hr"
      ? {}
      : req.user.role === "manager"
        ? { owner: req.user._id }
        : { "assignments.employee": (await ownEmployee(req.user))._id };
  const { page, limit } = pagination(req.query);
  let items = await Training.find(q)
    .populate("assignments.employee", "firstName lastName department")
    .populate("owner", "email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  if (req.user.role === "employee") {
    const own = await ownEmployee(req.user);
    items = items.map((t) => ({
      ...t.toObject(),
      assignments: t.assignments.filter(
        (a) => String(a.employee?._id) === String(own._id),
      ),
    }));
  }
  res.json({ items, total: await Training.countDocuments(q), page, limit });
}
async function validateAssignments(user, assignments) {
  const ids = assignments.map(String);
  if (new Set(ids).size !== ids.length)
    fail(400, "Duplicate employee assignments.");
  const allowed = await Employee.countDocuments({
    _id: { $in: assignments },
    status: "active",
    ...(await scope(user)),
  });
  if (allowed !== ids.length)
    fail(403, "Assign training only to active members of your team.");
}
export async function createTraining(req, res) {
  const { employeeIds, ...data } = req.body;
  if (data.date && data.date > data.dueDate)
    fail(400, "Training date must be on or before the deadline.");
  await validateAssignments(req.user, employeeIds);
  const record = await Training.create({
    ...data,
    owner: req.user._id,
    assignments: employeeIds.map((employee) => ({ employee })),
  });
  const employees = await Employee.find({ _id: { $in: employeeIds } });
  await Promise.all(
    employees.map((e) =>
      notify(e.user, "Training assigned", data.title, "/training"),
    ),
  );
  await audit(req.user, "Training created", record._id);
  res.status(201).json(record);
}
export async function updateTraining(req, res) {
  const record = await Training.findOne({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!record) fail(404, "Training not found or you are not its owner.");
  const { employeeIds, ...data } = req.body;
  if (
    (data.date ?? record.date) &&
    (data.date ?? record.date) > (data.dueDate ?? record.dueDate)
  )
    fail(400, "Training date must be on or before the deadline.");
  if (employeeIds) {
    await validateAssignments(req.user, employeeIds);
    record.assignments = employeeIds.map(
      (id) =>
        record.assignments.find((a) => String(a.employee) === id) || {
          employee: id,
        },
    );
  }
  Object.assign(record, data);
  await record.save();
  await audit(req.user, "Training updated", record._id);
  res.json(record);
}
export async function deleteTraining(req, res) {
  const record = await Training.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id,
  });
  if (!record) fail(404, "Training not found or you are not its owner.");
  await audit(req.user, "Training deleted", record._id);
  res.json({ message: "Training deleted." });
}
export async function progress(req, res) {
  const employee = await ownEmployee(req.user);
  const record = await Training.findOne({
    _id: req.params.id,
    "assignments.employee": employee._id,
  });
  if (!record) fail(404, "Assigned training not found.");
  const a = record.assignments.find(
    (a) => String(a.employee) === String(employee._id),
  );
  a.status = req.body.status;
  a.completedAt = a.status === "completed" ? new Date() : null;
  await record.save();
  await notify(
    record.owner,
    "Training progress updated",
    `${employee.firstName} updated progress on ${record.title}.`,
    "/training",
  );
  await audit(req.user, "Training progress updated", record._id);
  res.json(record);
}
