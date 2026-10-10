import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const notificationSchema = new Schema(
  {
    recipient: ref("User", true),
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "/dashboard" },
    read: { type: Boolean, default: false },
  },
  options,
);
notificationSchema.index({ recipient: 1, createdAt: -1 });
export default mongoose.model("Notification", notificationSchema);
