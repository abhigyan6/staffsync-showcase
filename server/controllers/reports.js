import { announcementAudience } from "../services/announcementAudience.js";
import {
  Employee,
  Attendance,
  Leave,
  Training,
  Announcement,
  Audit,
} from "../models/index.js";
import {
  scope,
  accessibleEmployees,
  ownEmployee,
  day,
  fail,
} from "../services/core.js";
export async function dashboard(req, res) {
  const employees = await Employee.find({
    ...(await scope(req.user)),
    status: "active",
  }).populate("user", "role");
  const ids = employees.map((e) => e._id);
  const today = day();
  const month = today.slice(0, 7);
  const [attendance, pending, upcoming, announcements, trainings] =
    await Promise.all([
      Attendance.find({ employee: { $in: ids }, date: today }).populate(
        "employee",
        "firstName lastName department avatar",
      ),
      Leave.find({ employee: { $in: ids }, status: "pending" })
        .populate("employee", "firstName lastName department avatar")
        .sort({ createdAt: -1 })
        .limit(5),
      Leave.find({
        employee: { $in: ids },
        status: "approved",
        startDate: { $lte: today },
        endDate: { $gte: today },
      }).populate("employee", "firstName lastName department avatar"),
      Announcement.find(announcementAudience(req.user))
        .sort({ pinned: -1, createdAt: -1 })
        .limit(3),
      Training.find(
        req.user.role === "hr"
          ? {}
          : req.user.role === "manager"
            ? { owner: req.user._id }
            : { "assignments.employee": ids[0] },
      ).limit(100),
    ]);
  const pendingCount = await Leave.countDocuments({
    employee: { $in: ids },
    status: "pending",
  });
  const departments = {};
  employees.forEach(
    (e) => (departments[e.department] = (departments[e.department] || 0) + 1),
  );
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const date = day(new Date(Date.now() - i * 86400000));
    const present = await Attendance.countDocuments({
      employee: { $in: ids },
      date,
      status: { $in: ["present", "late", "half-day"] },
    });
    trend.push({
      date,
      label: new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
      present,
      total: employees.length,
    });
  }
  const monthlyAttendance = await Attendance.countDocuments({
    employee: { $in: ids },
    date: { $gte: month + "-01", $lte: today },
    status: { $in: ["present", "late", "half-day"] },
  });
  const activity =
    req.user.role === "hr"
      ? await Audit.find()
          .populate("actor", "email role")
          .sort({ createdAt: -1 })
          .limit(6)
      : [];
  res.json({
    today,
    employees,
    stats: {
      employees: employees.length,
      present: attendance.filter((a) =>
        ["present", "late", "half-day"].includes(a.status),
      ).length,
      onLeave: upcoming.length,
      pending: pendingCount,
      departments: Object.keys(departments).length,
      monthlyAttendance,
    },
    attendance,
    pending,
    upcoming,
    announcements,
    departments: Object.entries(departments).map(([name, value]) => ({
      name,
      value,
    })),
    trend,
    activity,
    trainingCount: trainings.length,
    trainingCompleted: trainings
      .flatMap((t) => t.assignments)
      .filter((a) => a.status === "completed").length,
  });
}
export async function reports(req, res) {
  const from = req.query.from || day().slice(0, 7) + "-01",
    to = req.query.to || day();
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    from > to
  )
    fail(400, "Choose a valid report date range.");
  const employees = await Employee.find({ status: "active" }).sort({
    firstName: 1,
  });
  const [records, leaves] = await Promise.all([
    Attendance.find({ date: { $gte: from, $lte: to } }),
    Leave.find({
      status: "approved",
      startDate: { $lte: to },
      endDate: { $gte: from },
    }),
  ]);
  const items = employees.map((e) => {
    const own = records.filter((a) => String(a.employee) === String(e._id));
    return {
      employee: e,
      present: own.filter((a) => a.status === "present").length,
      late: own.filter((a) => a.status === "late").length,
      halfDay: own.filter((a) => a.status === "half-day").length,
      absent: own.filter((a) => a.status === "absent").length,
      hours:
        Math.round(
          own.reduce(
            (s, a) =>
              s +
              (a.checkIn &&
              a.checkOut &&
              ["present", "late", "half-day"].includes(a.status)
                ? Math.max(0, (a.checkOut - a.checkIn) / 3600000)
                : 0),
            0,
          ) * 10,
        ) / 10,
      leaveDays: leaves
        .filter((l) => String(l.employee) === String(e._id))
        .reduce(
          (s, l) =>
            s +
            Math.round(
              (Date.parse(l.endDate < to ? l.endDate : to) -
                Date.parse(l.startDate > from ? l.startDate : from)) /
                86400000,
            ) +
            1,
          0,
        ),
    };
  });
  res.json({
    from,
    to,
    items,
    totals: {
      hours: Math.round(items.reduce((s, i) => s + i.hours, 0)),
      present: items.reduce((s, i) => s + i.present, 0),
      leaveDays: items.reduce((s, i) => s + i.leaveDays, 0),
    },
  });
}
