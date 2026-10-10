export function announcementAudience(user) {
  if (user.role === "hr") return {};
  return {
    $or: [
      { targetAudience: "All" },
      { targetAudience: { $exists: false } },
      { targetAudience: user.role === "manager" ? "Managers" : "Employees" },
      { author: user._id },
    ],
  };
}
