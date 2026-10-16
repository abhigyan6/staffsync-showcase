import { announcementAudience } from "../services/announcementAudience.js";
import { Announcement, Notification, User } from "../models/index.js";
import { fail, audit, pagination } from "../services/core.js";
export async function announcements(req, res) {
  const { page, limit } = pagination(req.query);
  const q = announcementAudience(req.user);
  if (req.query.category) q.category = req.query.category;
  res.json({
    items: await Announcement.find(q)
      .populate("author", "email role")
      .sort({ pinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    total: await Announcement.countDocuments(q),
    page,
    limit,
  });
}
export async function postAnnouncement(req, res) {
  const record = await Announcement.create({
    ...req.body,
    author: req.user._id,
  });
  const users = await User.find({
    active: true,
    ...(record.targetAudience === "Employees"
      ? { role: "employee" }
      : record.targetAudience === "Managers"
        ? { role: "manager" }
        : {}),
    _id: { $ne: req.user._id },
  }).distinct("_id");
  await Notification.insertMany(
    users.map((recipient) => ({
      recipient,
      title: "New announcement",
      message: record.title,
      link: "/announcements",
    })),
  );
  await audit(req.user, "Announcement published", record._id);
  res.status(201).json(record);
}
export async function editAnnouncement(req, res) {
  const q = { _id: req.params.id };
  if (req.user.role !== "hr") q.author = req.user._id;
  const record = await Announcement.findOneAndUpdate(
    q,
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!record) fail(404, "Announcement not found or you are not its author.");
  await audit(req.user, "Announcement updated", record._id);
  res.json(record);
}
export async function deleteAnnouncement(req, res) {
  const q = { _id: req.params.id };
  if (req.user.role !== "hr") q.author = req.user._id;
  const record = await Announcement.findOneAndDelete(q);
  if (!record) fail(404, "Announcement not found or you are not its author.");
  await audit(req.user, "Announcement deleted", record._id);
  res.json({ message: "Announcement deleted." });
}
