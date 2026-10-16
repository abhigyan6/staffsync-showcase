import { User, Employee } from "../models/index.js";
import {
  scope,
  assertEmployee,
  ownEmployee,
  fail,
  audit,
  pagination,
  literal,
  notify,
} from "../services/core.js";
export async function list(req, res) {
  const q = { ...(await scope(req.user)) };
  q.status = req.query.status === "inactive" ? "inactive" : "active";
  if (req.query.department) q.department = req.query.department;
  if (req.query.search) {
    const rx = new RegExp(literal(req.query.search), "i");
    q.$or = [
      { firstName: rx },
      { lastName: rx },
      { email: rx },
      { employeeId: rx },
    ];
  }
  const { page, limit } = pagination(req.query);
  const [items, total] = await Promise.all([
    Employee.find(q)
      .select(req.user.role === "hr" ? "+salary +address" : "")
      .populate("user", "role")
      .populate("manager", "email")
      .sort({ firstName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Employee.countDocuments(q),
  ]);
  res.json({ items, total, page, limit });
}
export async function directory(req, res) {
  const q = { ...(await scope(req.user)), status: "active" };
  const items = await Employee.find(q)
    .populate("user", "role")
    .sort({ firstName: 1 })
    .limit(500);
  const managers =
    req.user.role === "hr"
      ? await Employee.find({
          status: "active",
          user: {
            $in: await User.find({ role: "manager", active: true }).distinct(
              "_id",
            ),
          },
        })
      : [];
  res.json({
    items,
    managers,
    departments: await Employee.distinct("department", { status: "active" }),
  });
}
export async function get(req, res) {
  const employee = await assertEmployee(req.user, req.params.id);
  if (
    req.user.role === "hr" ||
    String(employee.user) === String(req.user._id)
  ) {
    const privateFields = await Employee.findById(employee._id).select(
      "+salary +address",
    );
    employee.salary = privateFields.salary;
    employee.address = privateFields.address;
  }
  await employee.populate("user", "role");
  res.json(employee);
}
async function checkManager(id) {
  if (id && !(await User.exists({ _id: id, role: "manager", active: true })))
    fail(400, "Select an active manager.");
}
export async function create(req, res) {
  const { password, role, manager, ...data } = req.body;
  await checkManager(manager);
  const user = await User.create({
    email: data.email,
    role,
    password,
  });
  try {
    const employee = await Employee.create({
      ...data,
      user: user._id,
      manager: manager || null,
    });
    await audit(
      req.user,
      "Employee added",
      employee._id,
      `${data.firstName} ${data.lastName}`,
    );
    res.status(201).json(employee);
  } catch (e) {
    await User.deleteOne({ _id: user._id });
    throw e;
  }
}
export async function update(req, res) {
  const employee = await assertEmployee(req.user, req.params.id);
  const { manager, ...data } = req.body;
  await checkManager(manager);
  if (String(manager) === String(employee.user))
    fail(400, "An employee cannot manage themselves.");
  if (data.email) {
    const duplicate = await User.exists({
      email: data.email,
      _id: { $ne: employee.user },
    });
    if (duplicate) fail(409, "This email is already in use.");
    await User.updateOne(
      { _id: employee.user },
      { $set: { email: data.email } },
    );
  }
  Object.assign(employee, data);
  if (manager !== undefined) employee.manager = manager || null;
  await employee.save();
  await audit(
    req.user,
    "Employee updated",
    employee._id,
    `${employee.firstName} ${employee.lastName}`,
  );
  res.json(employee);
}
export async function remove(req, res) {
  const employee = await assertEmployee(req.user, req.params.id);
  if (String(employee.user) === String(req.user._id))
    fail(400, "You cannot remove your own account.");
  if (await Employee.exists({ manager: employee.user, status: "active" }))
    fail(409, "Reassign this manager’s team before removing their account.");
  employee.status = "inactive";
  await employee.save();
  await User.updateOne(
    { _id: employee.user },
    { $set: { active: false }, $inc: { sessionVersion: 1 } },
  );
  await audit(
    req.user,
    "Employee removed",
    employee._id,
    `${employee.firstName} ${employee.lastName}`,
  );
  res.json({
    message:
      "Employee removed from the active directory. Historical records retained.",
  });
}
export async function profile(req, res) {
  const e = await ownEmployee(req.user);
  Object.assign(e, req.body);
  await e.save();
  await audit(req.user, "Profile updated", e._id);
  res.json(e);
}
export async function performance(req, res) {
  const e = await assertEmployee(req.user, req.params.id);
  e.performance = {
    ...req.body,
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };
  await e.save();
  await notify(
    e.user,
    "Performance review updated",
    `Your manager updated your performance review.`,
    "/profile",
  );
  await audit(req.user, "Performance reviewed", e._id);
  res.json(e);
}
