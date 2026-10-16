import { Notification } from "../models/index.js";

export async function notifications(req, res) {
  res.json({
    items: await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(40),
    unread: await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    }),
  });
}
export async function readNotifications(req, res) {
  await Notification.updateMany(
    {
      recipient: req.user._id,
      ...(req.params.id ? { _id: req.params.id } : {}),
    },
    { $set: { read: true } },
  );
  res.json({ message: "Notifications marked as read." });
}
