import { Attendance } from "../models/index.js";
import {
  accessibleEmployees,
  ownEmployee,
  day,
  fail,
  audit,
  pagination,
} from "../services/core.js";
export async function attendance(req, res) {
  const ids = (await accessibleEmployees(req.user)).map((e) => e._id);
  const q = { employee: { $in: ids } };
  if (req.query.date) q.date = req.query.date;
  if (req.query.from || req.query.to) {
    q.date = {};
    if (req.query.from) q.date.$gte = req.query.from;
    if (req.query.to) q.date.$lte = req.query.to;
  }
  const { page, limit } = pagination(req.query);
  const [items, total] = await Promise.all([
    Attendance.find(q)
      .populate("employee", "firstName lastName department employeeId avatar")
      .sort({ date: -1, checkIn: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Attendance.countDocuments(q),
  ]);
  res.json({ items, total, page, limit });
}
export async function checkIn(req, res) {
  const employee = await ownEmployee(req.user);
  if (await Attendance.exists({ employee: employee._id, date: day() }))
    fail(409, "You have already checked in today.");
  const record = await Attendance.create({
    employee: employee._id,
    date: day(),
    checkIn: new Date(),
    status: "present",
  });
  await audit(req.user, "Checked in", record._id);
  res.status(201).json(record);
}
export async function checkOut(req, res) {
  const employee = await ownEmployee(req.user);
  const record = await Attendance.findOneAndUpdate(
    {
      employee: employee._id,
      date: day(),
      checkIn: { $ne: null },
      checkOut: null,
    },
    { $set: { checkOut: new Date() } },
    { new: true },
  );
  if (!record)
    fail(409, "Check in first, or you have already checked out today.");
  await audit(req.user, "Checked out", record._id);
  res.json(record);
}
export async function correctAttendance(req, res) {
  const record = await Attendance.findById(req.params.id);
  if (!record) fail(404, "Attendance record not found.");
  const data = req.body;
  const checkIn = data.checkIn ? new Date(data.checkIn) : record.checkIn;
  const checkOut = data.checkOut ? new Date(data.checkOut) : record.checkOut;
  if (checkOut && (!checkIn || checkOut < checkIn))
    fail(400, "Check-out must be after check-in.");
  Object.assign(record, data, { correctedBy: req.user._id });
  await record.save();
  await audit(req.user, "Attendance corrected", record._id, data.note);
  res.json(record);
}
