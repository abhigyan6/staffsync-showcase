import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const announcementSchema = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ["Company", "People", "Events", "Policy"],
      default: "Company",
    },
    pinned: { type: Boolean, default: false },
    targetAudience: {
      type: String,
      enum: ["All", "Employees", "Managers"],
      default: "All",
    },
    author: ref("User", true),
  },
  options,
);
announcementSchema.index({ pinned: -1, createdAt: -1 });
export default mongoose.model("Announcement", announcementSchema);
