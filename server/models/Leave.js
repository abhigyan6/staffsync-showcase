import mongoose from "mongoose";
const { Schema } = mongoose;
const ref = (model, required = false) => ({
  type: Schema.Types.ObjectId,
  ref: model,
  required,
});
const options = { timestamps: true };
const leaveSchema = new Schema(
  {
    employee: ref("Employee", true),
    type: {
      type: String,
      enum: ["Annual", "Sick", "Personal", "Unpaid"],
      required: true,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    reviewedBy: ref("User"),
    approverRole: { type: String, enum: ["hr", "manager"] },
    reviewedAt: Date,
    comment: { type: String, default: "" },
  },
  options,
);
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model("LeaveRequest", leaveSchema);
