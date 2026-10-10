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
export async function leaves(req, res) {
  const ids = (await accessibleEmployees(req.user)).map((e) => e._id);
  const q = { employee: { $in: ids } };
  if (req.query.status) q.status = req.query.status;
  const { page, limit } = pagination(req.query);
  const [items, total] = await Promise.all([
    Leave.find(q)
      .populate("employee", "firstName lastName department employeeId avatar")
      .populate("reviewedBy", "email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Leave.countDocuments(q),
  ]);
  res.json({ items, total, page, limit });
}
export async function apply(req, res) {
  const employee = await ownEmployee(req.user);
  const { startDate, endDate } = req.body;
  if (startDate < day()) fail(400, "Leave must start today or later.");
  if (endDate < startDate || span(startDate, endDate) > 90)
    fail(400, "Choose a valid leave period of up to 90 days.");
  const lease = new Date(Date.now() + 60000);
  const locked = await Employee.findOneAndUpdate(
    {
      _id: employee._id,
      $or: [{ leaveLockUntil: null }, { leaveLockUntil: { $lt: new Date() } }],
    },
    { $set: { leaveLockUntil: lease } },
  );
  if (!locked)
    fail(409, "Another leave request is being processed. Please try again.");
  try {
    if (
      await Leave.exists({
        employee: employee._id,
        status: { $in: ["pending", "approved"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      })
    )
      fail(409, "This overlaps an existing pending or approved request.");
    const record = await Leave.create({
      ...req.body,
      employee: employee._id,
      days: span(startDate, endDate),
    });
    const recipients = await User.find({ role: "hr", active: true }).distinct(
      "_id",
    );
    if (employee.manager) recipients.push(employee.manager);
    await Promise.all(
      recipients.map((id) =>
        notify(
          id,
          "New leave request",
          `${employee.firstName} ${employee.lastName} requested ${record.days} day(s) of leave.`,
          "/leaves",
        ),
      ),
    );
    await audit(req.user, "Leave requested", record._id);
    res.status(201).json(record);
  } finally {
    await Employee.updateOne(
      { _id: employee._id, leaveLockUntil: lease },
      { $set: { leaveLockUntil: null } },
    );
  }
}
export async function review(req, res) {
  const record = await Leave.findById(req.params.id);
  if (!record) fail(404, "Leave request not found.");
  const employee = await assertEmployee(req.user, record.employee);
  const updated = await Leave.findOneAndUpdate(
    { _id: record._id, status: "pending" },
    {
      $set: {
        status: req.body.status,
        comment: req.body.comment || "",
        reviewedBy: req.user._id,
        approverRole: req.user.role,
        reviewedAt: new Date(),
      },
    },
    { new: true },
  );
  if (!updated)
    fail(409, "This request has already been reviewed or cancelled.");
  await notify(
    employee.user,
    `Leave ${updated.status}`,
    `Your ${record.type.toLowerCase()} leave request was ${updated.status}.`,
    "/leaves",
  );
  await audit(req.user, `Leave ${updated.status}`, record._id);
  res.json(updated);
}
export async function cancel(req, res) {
  const employee = await ownEmployee(req.user);
  const record = await Leave.findOneAndUpdate(
    { _id: req.params.id, employee: employee._id, status: "pending" },
    { $set: { status: "cancelled" } },
    { new: true },
  );
  if (!record) fail(409, "Only your pending requests can be cancelled.");
  await audit(req.user, "Leave cancelled", record._id);
  res.json(record);
}
